(() => {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const route = document.querySelector(".route-line");
  const climber = document.querySelector(".climber");

  if (!route || !climber || motionQuery.matches) {
    return;
  }

  const routeLength = route.getTotalLength();
  let ticking = false;

  const updateClimber = () => {
    const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
    const point = route.getPointAtLength(routeLength * progress);

    climber.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateClimber);
      ticking = true;
    }
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateClimber();
})();
