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
  angle: number;
}

type ParticleShape = 'circle' | 'square' | 'triangle' | 'star';

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
  private shape: ParticleShape;
  private angleEnabled: boolean;
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
    options: {
      el?: HTMLElement | string;
      color?: string;
      sizes?: [number, number];
      shape?: ParticleShape;
      angle?: boolean;
    } = {},
  ) {
    const {
      el,
      color = 'rgb(120, 200, 150)',
      sizes = [3, 12],
      shape = 'circle',
      angle = false,
    } = options;

    this.particleColor = color;
    this.sizes = sizes;
    this.shape = shape;
    this.angleEnabled = angle;

    if (el instanceof HTMLElement) {
      this.container = el;
    } else if (typeof el === 'string') {
      this.container = document.querySelector(el);
    } else {
      this.container = document.querySelector('.bubbles');
    }

    if (this.container) {
      this.canvas = document.createElement('canvas');

      Object.assign(this.canvas.style, {
        position: 'absolute',
        inset: '0',
        margin: 'auto',
      });

      this.container.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }
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

  private initializeParticle(particle: Particle, x: number, y: number): void {
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
    particle.angle = this.angleEnabled ? this.randomFloat(0, 360) + Math.random() * 180 : 0;
  }

  private createParticle(x: number, y: number): Particle {
    const particle: Particle = {} as Particle;

    this.initializeParticle(particle, x, y);

    return particle;
  }

  private resetParticle(particle: Particle, x: number, y: number): void {
    this.initializeParticle(particle, x, y);
  }

  private updateParticle(particle: Particle, deltaTime: number): void {
    particle.elapsedTime += deltaTime;

    const timeFactor = deltaTime / 16.67;
    const accelerationX = (particle.initialX - particle.x) * particle.accelerationFactor;
    const wobble = this.randomFloat(...BubblesRising.WOBBLE_RANGE);

    particle.velocityX += (accelerationX + wobble) * timeFactor;
    particle.x += particle.velocityX * timeFactor;
    particle.y =
      0.5 * particle.accelerationY * particle.elapsedTime ** 2 + this.height + particle.size * 3;

    if (particle.elapsedTime >= BubblesRising.MAX_ELAPSED_TIME) {
      particle.opacity = Math.max(0, particle.opacity - particle.opacityDecay * timeFactor);
    }
  }

  private drawParticle(particle: Particle): void {
    if (!this.ctx) return;

    this.ctx.globalAlpha = particle.opacity;
    this.ctx.fillStyle = this.particleColor;
    this.ctx.save();
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate((particle.angle * Math.PI) / 180);

    switch (this.shape) {
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
        this.ctx.fill();

        break;
      case 'square':
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);

        break;
      case 'triangle':
        this.ctx.beginPath();
        this.ctx.moveTo(0, -particle.size);
        this.ctx.lineTo(-particle.size, particle.size / 2);
        this.ctx.lineTo(particle.size, particle.size / 2);
        this.ctx.closePath();
        this.ctx.fill();

        break;
      case 'star':
        this.drawStar(0, 0, particle.size / 2, 5);

        break;
    }

    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private drawStar(cx: number, cy: number, outerRadius: number, spikes: number): void {
    if (!this.ctx) return;

    const step = Math.PI / spikes;
    const innerRadius = outerRadius / 2;

    this.ctx.beginPath();

    for (let i = 0; i < 2 * spikes; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(i * step) * radius;
      const y = cy + Math.sin(i * step) * radius;

      this.ctx.lineTo(x, y);
    }

    this.ctx.closePath();
    this.ctx.fill();
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
