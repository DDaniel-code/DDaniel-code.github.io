(() => {
  const climber = document.querySelector(".climber");
  if (!climber) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 1100px)");
  const holds = [...document.querySelectorAll(".climbing-route .holds use")]
    .map((hold) => ({ x: Number(hold.getAttribute("x")), y: Number(hold.getAttribute("y")) }));
  const limbs = [...climber.querySelectorAll("[data-limb]")];
  const originalPose = limbs.map((limb) => limb.getAttribute("d"));
  const originalPosition = climber.getAttribute("transform");

  // Cream insets give the articulated limbs the same outline as the shell.
  document.querySelectorAll(".robot-limbs path").forEach((limb) => {
    const inset = limb.cloneNode();
    inset.removeAttribute("data-limb");
    inset.classList.add("limb-inset");
    limb.after(inset);
  });

  let frame = null;
  let listening = false;
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const ease = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const between = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
  const phase = (t, start, end) => ease((t - start) / (end - start));
  const center = (index) => ({
    x: (holds[index].x + holds[index + 1].x) / 2 - 3,
    y: (holds[index].y + holds[index + 1].y) / 2,
  });

  const render = () => {
    frame = null;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const progress = range > 0 ? clamp(window.scrollY / range) : 0;
    const travel = progress * (holds.length - 2);
    const step = Math.min(Math.floor(travel), holds.length - 3);
    const t = travel - step;
    const body = between(center(step), center(step + 1), phase(t, 0.12, 0.88));
    const leading = step % 2;
    const targets = [
      between(holds[step + 1], holds[step + 2], phase(t, leading ? 0 : 0.42, leading ? 0.55 : 0.9)),
      between(holds[step + 1], holds[step + 2], phase(t, leading ? 0.42 : 0, leading ? 0.9 : 0.55)),
      between(holds[step], holds[step + 1], phase(t, 0.25, 0.82)),
      between(holds[step], holds[step + 1], phase(t, 0.4, 1)),
    ];
    climber.setAttribute("transform", `translate(${body.x.toFixed(2)} ${body.y.toFixed(2)})`);

    limbs.forEach((limb, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const arm = index < 2;
      const start = { x: side * (arm ? 6 : 4), y: arm ? -7 : 2 };
      const end = {
        x: targets[index].x - body.x + side * 3,
        y: targets[index].y - body.y + (arm ? -3 : -1),
      };
      // Keep a compact silhouette during a reach instead of stretching the limbs.
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const reach = Math.hypot(dx, dy);
      if (reach > 25) {
        end.x = start.x + dx * 25 / reach;
        end.y = start.y + dy * 25 / reach;
      }
      // Elbows and knees bend outward during each transfer.
      const joint = {
        x: (start.x + end.x) / 2 + side * (arm ? 7 : 8),
        y: (start.y + end.y) / 2 + (arm ? 4 : -3),
      };
      const path = `M${start.x} ${start.y} L${joint.x.toFixed(2)} ${joint.y.toFixed(2)} L${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
      limb.setAttribute("d", path);
      limb.nextElementSibling.setAttribute("d", path);
    });
  };

  const requestRender = () => {
    if (frame === null) frame = window.requestAnimationFrame(render);
  };
  const configure = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    if (listening) {
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", requestRender);
      listening = false;
    }
    if (motion.matches || !desktop.matches) {
      climber.setAttribute("transform", originalPosition);
      limbs.forEach((limb, index) => {
        limb.setAttribute("d", originalPose[index]);
        limb.nextElementSibling.setAttribute("d", originalPose[index]);
      });
      return;
    }
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    listening = true;
    render();
  };
  motion.addEventListener("change", configure);
  desktop.addEventListener("change", configure);
  configure();
})();
