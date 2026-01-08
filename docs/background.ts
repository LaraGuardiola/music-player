interface Particle {
  element: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function createFloatingParticles(): void {
  const particleCount = 50;
  const particles: Particle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const color = Math.random() > 0.5 ? "#ff0096" : "#00ffff";

    particle.style.position = "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = color;
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "-1";
    particle.style.opacity = "0.3";
    particle.style.boxShadow = `0 0 6px ${color}`;

    document.body.appendChild(particle);
    particles.push({
      element: particle,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  function animateParticles(): void {
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
      if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;

      particle.element.style.left = particle.x + "px";
      particle.element.style.top = particle.y + "px";
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}
