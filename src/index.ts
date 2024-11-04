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
  private static readonly MAX_ELAPSED_TIME = 400;
  private static readonly DEFAULT_VELOCITY_X = 0.02;
  private static readonly DEFAULT_OPACITY_DECAY = 0.0015;
  private static readonly ACCELERATION_Y_DIVISOR = -120000;
  private static readonly ACCELERATION_FACTOR_DIVISOR = 10000;
  private static readonly WOBBLE_RANGE: [number, number] = [-0.0075, 0.0075];

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
        this.handleResize();
      }
    });

    this.resizeObserver.observe(this.container);
  }

  private handleResize(): void {
    this.resizeScheduled = false;
    this.initializeCanvas();
  }

  private lastFrameTime: number = performance.now();

  private calculateParticleCount(): number {
    const area = this.width * this.height;
    const baseArea = 1920 * 1080;
    const scalingFactor = area / baseArea;
    const minParticles = 10;
    const maxParticles = 100;

    return Math.max(
      minParticles,
      Math.min(maxParticles, Math.round(BubblesRising.PARTICLE_COUNT * scalingFactor)),
    );
  }

  private renderLoop = (): void => {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    this.lastFrameTime = now;

    this.animationFrameId = requestAnimationFrame(this.renderLoop);

    if (!this.ctx || !this.canvas) return;

    if (now - this.lastParticleAddTime >= BubblesRising.PARTICLE_ADD_INTERVAL) {
      const particleCount = this.calculateParticleCount();

      this.addParticles(particleCount);
      this.lastParticleAddTime = now;
    }

    this.render(deltaTime);
  };

  private render(deltaTime: number): void {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.particleColor;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      this.updateParticle(particle, deltaTime);
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

      const startX = Math.random() * this.width;

      if (this.particlePool.length > 0) {
        particle = this.particlePool.pop()!;

        this.resetParticle(particle, startX, this.height);
      } else {
        particle = this.createParticle(startX, this.height);
      }

      this.particles.push(particle);
    }
  }

  private createParticle(x: number, y: number): Particle {
    const [minSize, maxSize] = this.sizes;

    return {
      x,
      y,
      size: this.randomFloat(minSize, maxSize),
      accelerationY: this.randomFloat(0.5, 1.5) / BubblesRising.ACCELERATION_Y_DIVISOR,
      accelerationFactor: this.randomFloat(0.2, 0.5) / BubblesRising.ACCELERATION_FACTOR_DIVISOR,
      velocityX: BubblesRising.DEFAULT_VELOCITY_X,
      initialX: x,
      elapsedTime: 0,
      opacity: 1,
      opacityDecay: BubblesRising.DEFAULT_OPACITY_DECAY,
    };
  }

  private resetParticle(particle: Particle, x: number, y: number): void {
    const [minSize, maxSize] = this.sizes;

    particle.x = x;
    particle.y = y;
    particle.size = this.randomFloat(minSize, maxSize);
    particle.accelerationY = this.randomFloat(0.5, 1.5) / BubblesRising.ACCELERATION_Y_DIVISOR;
    particle.accelerationFactor =
      this.randomFloat(0.2, 0.5) / BubblesRising.ACCELERATION_FACTOR_DIVISOR;
    particle.velocityX = BubblesRising.DEFAULT_VELOCITY_X;
    particle.initialX = x;
    particle.elapsedTime = 0;
    particle.opacity = 1;
    particle.opacityDecay = BubblesRising.DEFAULT_OPACITY_DECAY;
  }

  private updateParticle(particle: Particle, deltaTime: number): void {
    particle.elapsedTime += deltaTime;

    const accelerationX = (particle.initialX - particle.x) * particle.accelerationFactor;
    const wobble = this.randomFloat(...BubblesRising.WOBBLE_RANGE);

    particle.velocityX += (accelerationX + wobble) * (deltaTime / 16.67);
    particle.x += particle.velocityX * (deltaTime / 16.67);

    particle.y =
      0.5 * particle.accelerationY * particle.elapsedTime ** 2 + this.height + particle.size * 3;

    if (particle.elapsedTime >= BubblesRising.MAX_ELAPSED_TIME) {
      particle.opacity = Math.max(
        0,
        particle.opacity - particle.opacityDecay * (deltaTime / 16.67),
      );
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
