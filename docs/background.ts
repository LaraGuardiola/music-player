interface Particle {
  element: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function createFloatingParticles(targetElement?: HTMLElement): void {
  const particleCount = 50;
  const particles: Particle[] = [];
  const container = targetElement || document.body;
  const isTargetElement = targetElement !== undefined;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    const color = Math.random() > 0.5 ? "#ff0096" : "#00ffff";

    particle.style.position = isTargetElement ? "absolute" : "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = color;
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = isTargetElement ? "1" : "0";
    particle.style.opacity = "0.5";
    particle.style.boxShadow = `0 0 6px ${color}`;

    container.appendChild(particle);
    
    // Get container dimensions for positioning
    const rect = container.getBoundingClientRect();
    const width = isTargetElement ? rect.width : window.innerWidth;
    const height = isTargetElement ? rect.height : window.innerHeight;

    particles.push({
      element: particle,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    });
  }

  function animateParticles(): void {
    const rect = container.getBoundingClientRect();
    const width = isTargetElement ? rect.width : window.innerWidth;
    const height = isTargetElement ? rect.height : window.innerHeight;

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      particle.element.style.left = particle.x + "px";
      particle.element.style.top = particle.y + "px";
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}
