interface Particle {
  x: number;
  y: number;
  size: number;
  accelerationY: number;
  accelerationFactor: number;
  velocityX: number;
  initialX: number;
  elapsedTime: number;
  opacity: number;
  opacityDecay: number;
}

class BubblesRising {
  private container: HTMLElement | null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private fps: number = 60;
  private frameTime: number = 1000 / this.fps;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private lastParticleAddTime: number = performance.now();
  private resizeObserver: ResizeObserver | null = null;
  private resizeScheduled: boolean = false;
  private particleColor: string;
  private sizes: [number, number];
  private animationFrameId: number | null = null;

  private static readonly PARTICLE_ADD_INTERVAL = 500;
  private static readonly PARTICLE_COUNT = 30;
  private static readonly MAX_ELAPSED_TIME = 1200;

  constructor(
    options: { el?: HTMLElement | string; color?: string; sizes?: [number, number] } = {},
  ) {
    const { el, color = 'rgb(120, 200, 150)', sizes = [3, 12] } = options;

    this.particleColor = color;
    this.sizes = sizes;

    if (el instanceof HTMLElement) {
      this.container = el;
    } else if (typeof el === 'string') {
      this.container = document.querySelector(el);
    } else {
      this.container = document.querySelector('.bubbles');
    }

    if (!this.container) return;

    this.canvas = document.createElement('canvas');

    Object.assign(this.canvas.style, {
      position: 'absolute',
      inset: '0',
      margin: 'auto',
    });

    this.container.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) return;

    this.particleColor = color;
    this.sizes = sizes;
  }

  private initializeCanvas(): void {
    if (!this.container || !this.canvas) return;

    const { clientWidth: width, clientHeight: height } = this.container;

    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  private setupResizeListener(): void {
    if (!this.container) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.resizeScheduled) {
        this.resizeScheduled = true;

        requestAnimationFrame(() => this.handleResize());
      }
    });

    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    this.resizeScheduled = false;
    this.initializeCanvas();
  }

  private renderLoop = (): void => {
    const now = performance.now();

    this.animationFrameId = requestAnimationFrame(this.renderLoop);

    if (!this.ctx || !this.canvas) return;

    if (now - this.lastParticleAddTime >= BubblesRising.PARTICLE_ADD_INTERVAL) {
      this.addParticles(BubblesRising.PARTICLE_COUNT);
      this.lastParticleAddTime = now;
    }

    this.render();
  };

  private render(): void {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.particleColor;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      this.updateParticle(particle);
      this.drawParticle(particle);

      if (particle.opacity <= 0) {
        this.returnParticleToPool(particle);
        this.particles.splice(i, 1);
      }
    }
  }

  private addParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      let particle: Particle;

      if (this.particlePool.length > 0) {
        particle = this.particlePool.pop()!;

        this.resetParticle(particle, Math.random() * this.width, this.height);
      } else {
        particle = this.createParticle(Math.random() * this.width, this.height);
      }

      this.particles.push(particle);
    }
  }

  private createParticle(x: number, y: number): Particle {
    const [minSize, maxSize] = this.sizes;

    return {
      x: x,
      y: y,
      size: this.randomFloat(minSize, maxSize),
      accelerationY: this.randomFloat(0.5, 1.5) / -180000,
      accelerationFactor: this.randomFloat(0.1, 0.5) / 10000,
      velocityX: 0.05,
      initialX: x,
      elapsedTime: 0,
      opacity: 1,
      opacityDecay: 0.00125,
    };
  }

  private resetParticle(particle: Particle, x: number, y: number): void {
    const [minSize, maxSize] = this.sizes;

    particle.x = x;
    particle.y = y;
    particle.size = this.randomFloat(minSize, maxSize);
    particle.accelerationY = this.randomFloat(0.5, 1.5) / -180000;
    particle.accelerationFactor = this.randomFloat(0.1, 0.5) / 10000;
    particle.velocityX = 0.05;
    particle.initialX = x;
    particle.elapsedTime = 0;
    particle.opacity = 1;
    particle.opacityDecay = 0.00125;
  }

  private updateParticle(particle: Particle): void {
    particle.elapsedTime += this.frameTime;

    const accelerationX = (particle.initialX - particle.x) * particle.accelerationFactor;
    const wobble = this.randomFloat(-0.0075, 0.0075);

    particle.velocityX += accelerationX + wobble;
    particle.x += particle.velocityX;

    particle.y =
      0.5 * particle.accelerationY * particle.elapsedTime ** 2 + this.height + particle.size * 3;

    if (particle.elapsedTime >= BubblesRising.MAX_ELAPSED_TIME) {
      particle.opacity = Math.max(0, particle.opacity - particle.opacityDecay);
    }
  }

  private drawParticle(particle: Particle): void {
    if (!this.ctx) return;

    this.ctx.globalAlpha = particle.opacity;
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private returnParticleToPool(particle: Particle): void {
    this.particlePool.push(particle);
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);

      this.animationFrameId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.particlePool = [];
  }

  public init(): void {
    if (!this.canvas || !this.ctx) return;

    this.initializeCanvas();
    this.setupResizeListener();
    this.renderLoop();
  }
}

export default BubblesRising;
