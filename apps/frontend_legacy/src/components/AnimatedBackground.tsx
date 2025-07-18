import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const mathFormulas = [
  'E = mc²', 'F = ma', 'a² + b² = c²', 'x = (-b ± √(b²-4ac))/2a', '∫ f(x)dx', 'lim x→∞ f(x)', 'df/dx',
  'e^(iπ) + 1 = 0', 'v = u + at', 's = ut + ½at²', 'F = Gm₁m₂/r²', 'PV = nRT', 'λ = h/p', 'E = hf', 'V = IR',
  'P = VI', 'A = πr²', 'V = ⁴⁄₃πr³', 'C = 2πr', 'sin²θ + cos²θ = 1', 'tan θ = sin θ/cos θ', '∑(1/n²) = π²/6',
  '∂f/∂x', '∇ · F', '∮ F · dl', 'x̄ = (1/n)∑xᵢ', 'σ = √((1/n)∑(xᵢ-x̄)²)', 'P(A|B) = P(B|A)P(A)/P(B)', 'y = mx + b',
  'A = bh', 'd = rt', 'P = 2l + 2w', 'f(x) = ax² + bx + c', 'log_a b = ln b/ln a', '√a · √b = √(ab)', 'n! = n·(n-1)!',
  'C(n,k) = n!/(k!(n-k)!)', 'Q = mcΔT', 'ω = 2πf', 'I = Q/t', 'W = Fd cos θ', 'KE = ½mv²', 'PE = mgh',
  'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'τ', 'φ', 'ψ', 'ω', '∞', '∑', '∏', '∫', '∂', '∇', '∆', '±', '≠', '≤', '≥', '≈', '∝'
];

const getRandomFormula = () => mathFormulas[Math.floor(Math.random() * mathFormulas.length)];
type FormulaSize = keyof typeof sizeMap;

const getRandomSize = (): FormulaSize => {
  const sizes: FormulaSize[] = ['small', 'medium', 'large'];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

const sizeMap = {
  small: 18,
  medium: 28,
  large: 38
};

interface Formula {
  text: string;
  size: FormulaSize;
  width: number;
  height: number;
  id: number;
  x?: number;
  y?: number;
  angle?: number;
}

const FormulaPhysicsBackground: React.FC = () => {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [dragged, setDragged] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const mouseConstraintRef = useRef<Matter.MouseConstraint | null>(null);

  // Screen size
  const width = window.innerWidth;
  const height = window.innerHeight;

  useEffect(() => {
    // Init engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    // Create formulas
    const formulaObjs: Formula[] = Array.from({ length: 35 }, (_, i) => {
      const size = getRandomSize();
      return {
        text: getRandomFormula(),
        size,
        width: sizeMap[size] * 6,
        height: sizeMap[size] * 2,
        id: i
      };
    });
    setFormulas(formulaObjs);

    // Create bodies
    bodiesRef.current = formulaObjs.map((f, i) =>
      Matter.Bodies.rectangle(
        Math.random() * (width - 120),
        Math.random() * (height - 80),
        f.width,
        f.height,
        {
          restitution: 0.9,
          friction: 0.01,
          frictionAir: 0.02,
          label: String(i)
        }
      )
    );

    // Add bodies to world
    Matter.World.add(world, bodiesRef.current);

    // Add walls
    const wallThickness = 60;
    const walls = [
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, { isStatic: true }),
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, { isStatic: true })
    ];
    Matter.World.add(world, walls);

    // Mouse constraint
    const mouse = Matter.Mouse.create(document.body);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    mouseConstraintRef.current = mouseConstraint;
    Matter.World.add(world, mouseConstraint);

    // Run engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Animation loop
    const update = () => {
      setFormulas((prev) =>
        prev.map((f, i) => {
          const body = bodiesRef.current[i];
          return {
            ...f,
            x: body.position.x,
            y: body.position.y,
            angle: body.angle
          };
        })
      );
      requestAnimationFrame(update);
    };
    update();

    // Clean up
    return () => {
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      if (runner) Matter.Runner.stop(runner);
    };
    // eslint-disable-next-line
  }, []);

  // Drag interaction
  useEffect(() => {
    if (!mouseConstraintRef.current) return;
    const mouseConstraint = mouseConstraintRef.current;
    const handleStart = () => {
      if (mouseConstraint.body) {
        setDragged(Number(mouseConstraint.body.label));
      }
    };
    const handleEnd = () => setDragged(null);

    Matter.Events.on(mouseConstraint, 'startdrag', handleStart);
    Matter.Events.on(mouseConstraint, 'enddrag', handleEnd);

    return () => {
      Matter.Events.off(mouseConstraint, 'startdrag', handleStart);
      Matter.Events.off(mouseConstraint, 'enddrag', handleEnd);
    };
  }, []);

  // Push on click
  const handlePush = (i: number) => {
    const body = bodiesRef.current[i];
    if (body) {
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.08,
        y: (Math.random() - 0.5) * 0.08
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-auto z-0"
      style={{ width: '100vw', height: '100vh' }}
    >
      {formulas.map((f, i) => (
        <div
          key={f.id}
          onMouseDown={() => handlePush(i)}
          style={{
            position: 'absolute',
            left: (f.x ?? 0) - f.width / 2,
            top: (f.y ?? 0) - f.height / 2,
            fontSize: sizeMap[f.size],
            fontFamily: 'monospace',
            color: dragged === i ? '#ca181f' : '#ca181f99',
            background: dragged === i ? '#fff8' : 'transparent',
            borderRadius: 8,
            padding: '2px 8px',
            boxShadow: dragged === i ? '0 0 12px #ca181f44' : 'none',
            userSelect: 'none',
            cursor: 'grab',
            transform: `rotate(${f.angle ?? 0}rad)`,
            transition: 'background 0.2s, color 0.2s'
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
};

export default FormulaPhysicsBackground;
