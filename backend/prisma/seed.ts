import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.document.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.task.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.research.deleteMany();
  await prisma.algorithm.deleteMany();
  await prisma.project.deleteMany();

  const shapeDrawer = await prisma.project.create({
    data: {
      name: 'Shape Drawer',
      description: 'GSAP geometric rendering frontend for glass shape visualization and editing.',
      status: 'ACTIVE',
      progress: 82,
      team: 'SPIL Opti',
    },
  });

  const geometricCore = await prisma.project.create({
    data: {
      name: 'Geometric Core',
      description: 'Java polygon engine (shapes-core) — boolean ops, offset, arc fitting.',
      status: 'ACTIVE',
      progress: 74,
      team: 'SPIL Opti',
    },
  });

  const optiShapes = await prisma.project.create({
    data: {
      name: 'Opti-Shapes',
      description: 'React glass shape management frontend for production workflows.',
      status: 'ACTIVE',
      progress: 68,
      team: 'SPIL Opti',
    },
  });

  const nestingEngine = await prisma.project.create({
    data: {
      name: 'Nesting Engine',
      description: 'Optimization engine for sheet layout and material utilization.',
      status: 'PAUSED',
      progress: 45,
      team: 'SPIL Opti',
    },
  });

  const validationEngine = await prisma.project.create({
    data: {
      name: 'Validation Engine',
      description: 'Manufacturability scoring and constraint validation for glass shapes.',
      status: 'ACTIVE',
      progress: 55,
      team: 'SPIL Opti',
    },
  });

  await prisma.algorithm.createMany({
    data: [
      {
        name: 'Polygon Boolean Operations',
        category: 'Geometry',
        complexity: 'O(n log n)',
        description: 'Union, intersection, difference, and XOR operations on polygon sets.',
        implementation: 'Weiler-Atherton clipping algorithm with edge case handling for coincident edges.',
        usedIn: JSON.stringify(['shapes-core', 'validation-engine']),
        alternatives: 'Greiner-Hormann, Vatti clipping',
        codeRef: 'shapes-core/src/geometry/BooleanOps.java',
      },
      {
        name: 'Convex Hull — Graham Scan',
        category: 'Geometry',
        complexity: 'O(n log n)',
        description: 'Computes the convex hull of a set of 2D points.',
        implementation: 'Graham scan with polar angle sorting.',
        usedIn: JSON.stringify(['shapes-core']),
        alternatives: 'Jarvis march, Monotone chain',
        codeRef: 'shapes-core/src/geometry/ConvexHull.java',
      },
      {
        name: 'QuadTree',
        category: 'Spatial',
        complexity: 'O(log n) avg',
        description: 'Hierarchical spatial partitioning for 2D region queries.',
        implementation: 'Recursive subdivision with configurable max depth and node capacity.',
        usedIn: JSON.stringify(['nesting-engine', 'shapes-core']),
        alternatives: 'Uniform Grid, R-Tree',
        codeRef: 'shapes-core/src/spatial/QuadTree.java',
      },
      {
        name: 'Sweep Line',
        category: 'Spatial',
        complexity: 'O(n log n)',
        description: 'Line sweep algorithm for segment intersection detection.',
        implementation: 'Bentley-Ottmann with event queue.',
        usedIn: JSON.stringify(['shapes-core', 'validation-engine']),
        alternatives: 'Brute force O(n²)',
        codeRef: 'shapes-core/src/spatial/SweepLine.java',
      },
      {
        name: 'Bin Packing — First Fit Decreasing',
        category: 'Optimization',
        complexity: 'O(n log n)',
        description: 'Heuristic bin packing for sheet nesting optimization.',
        implementation: 'Sort by area descending, place in first fitting bin.',
        usedIn: JSON.stringify(['nesting-engine']),
        alternatives: 'Best Fit, Genetic Algorithm',
        codeRef: 'nesting-engine/src/packing/FirstFitDecreasing.java',
      },
      {
        name: 'Arc Fitting',
        category: 'Geometry',
        complexity: 'O(n)',
        description: 'Fits circular arcs to polyline segments for smooth curve representation.',
        implementation: 'Least-squares circle fit with tolerance threshold.',
        usedIn: JSON.stringify(['shapes-core']),
        alternatives: 'Bezier fitting, spline interpolation',
        codeRef: 'shapes-core/src/geometry/ArcFitting.java',
      },
    ],
  });

  await prisma.decision.createMany({
    data: [
      {
        number: 1,
        title: 'Use Java for geometry core',
        decision: 'Implement shapes-core in Java with no JNI bridge to native code.',
        reason: 'Team expertise, JVM portability, and mature geometry libraries.',
        rejected: 'C++ with JNI, Rust native module',
        status: 'ACCEPTED',
        affectedModules: JSON.stringify(['shapes-core']),
        projectId: geometricCore.id,
      },
      {
        number: 12,
        title: 'SVG over Canvas for shape renderer',
        decision: 'Use SVG elements for shape rendering in Shape Drawer.',
        reason: 'DOM inspectability, CSS styling, and accessibility for complex shapes.',
        rejected: 'HTML5 Canvas, WebGL',
        status: 'ACCEPTED',
        affectedModules: JSON.stringify(['shape-drawer', 'opti-shapes']),
        projectId: shapeDrawer.id,
      },
      {
        number: 14,
        title: 'QuadTree over Uniform Grid for nesting',
        decision: 'Use QuadTree instead of Uniform Grid for spatial lookups in nesting engine.',
        reason: 'Faster spatial lookup for nesting engine. O(log n) vs O(n) for large sheet queries.',
        rejected: 'Uniform Grid, R-Tree',
        status: 'ACCEPTED',
        affectedModules: JSON.stringify(['shapes-core', 'nesting-engine']),
        projectId: nestingEngine.id,
      },
    ],
  });

  await prisma.research.createMany({
    data: [
      {
        title: 'Arc Sweep Flag Bug in Cutout 111',
        problem: 'SVG arc flags incorrectly rendered in cutout profile 111. Large-arc and sweep flags produce inverted geometry.',
        hypothesis: 'The arc sweep flag parser does not handle negative coordinate systems.',
        experiment: 'Tested 48 arc flag combinations against reference SVG renderer output.',
        results: '12 of 48 combinations failed. All failures involved sweep-flag=1 with negative y-axis.',
        conclusion: 'Fixed by normalizing coordinate system before arc computation.',
        nextSteps: 'Add regression test suite for arc flag combinations.',
        status: 'CONCLUDED',
        tags: JSON.stringify(['GEOMETRY', 'shapes-core']),
        projectId: geometricCore.id,
      },
      {
        title: 'AI Shape Recognition from Sketch',
        problem: 'Manual DXF creation is slow. Can we extract geometry from photos or sketches?',
        hypothesis: 'A vision model can detect glass shape outlines and convert to polygon vertices.',
        experiment: 'Testing Claude vision API on 20 sample glass photos with known DXF ground truth.',
        status: 'EXPERIMENTING',
        tags: JSON.stringify(['AI', 'opti-shapes']),
        projectId: optiShapes.id,
      },
      {
        title: 'DXF Health Check on Import',
        problem: 'Imported DXF files often contain broken geometry that crashes the renderer.',
        hypothesis: 'A pre-import validation pass can catch 90% of problematic DXF files.',
        status: 'IDEA',
        tags: JSON.stringify(['VALIDATION', 'validation-engine']),
        projectId: validationEngine.id,
      },
    ],
  });

  await prisma.idea.createMany({
    data: [
      {
        title: 'Photo → DXF Extraction',
        description: 'Upload a photo or sketch of a glass shape and automatically extract geometry as DXF.',
        rating: 5,
        priority: 'HIGH',
        status: 'BACKLOG',
        tags: JSON.stringify(['AI', 'DXF']),
      },
      {
        title: 'Real-time Cost Calculator',
        description: 'Live material cost estimation as shapes are drawn, factoring waste and cutting time.',
        rating: 5,
        priority: 'HIGH',
        status: 'BACKLOG',
        tags: JSON.stringify(['OPTIMIZATION', 'ERP']),
      },
      {
        title: 'Machine Digital Twin',
        description: 'Virtual model of cutting machines for simulation and constraint validation.',
        rating: 4,
        priority: 'MEDIUM',
        status: 'BACKLOG',
        tags: JSON.stringify(['SIMULATION', 'R&D']),
      },
      {
        title: 'Manufacturability Score',
        description: 'Automated scoring of shape complexity against machine capabilities.',
        rating: 4,
        priority: 'MEDIUM',
        status: 'EVALUATING',
        tags: JSON.stringify(['VALIDATION', 'SCORING']),
      },
    ],
  });

  const dueDate = new Date('2026-06-15');

  await prisma.task.createMany({
    data: [
      {
        title: 'Fix arc sweep flag in cutout 111',
        description: 'Correct SVG arc flag handling for negative coordinate systems.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignee: 'Damitha',
        dueDate,
        module: 'shapes-core',
        projectId: geometricCore.id,
      },
      {
        title: 'Implement QuadTree spatial index',
        description: 'Replace uniform grid with QuadTree for nesting lookups.',
        status: 'TODO',
        priority: 'HIGH',
        assignee: 'Damitha',
        dueDate: new Date('2026-06-20'),
        module: 'nesting-engine',
        projectId: nestingEngine.id,
      },
      {
        title: 'Add SVG arc regression tests',
        description: 'Test suite for all 48 arc flag combinations.',
        status: 'TODO',
        priority: 'MEDIUM',
        assignee: 'Damitha',
        module: 'shapes-core',
        projectId: geometricCore.id,
      },
      {
        title: 'Shape drawer zoom performance',
        description: 'Optimize re-render on zoom for shapes with 500+ vertices.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assignee: 'Damitha',
        module: 'shape-drawer',
        projectId: shapeDrawer.id,
      },
      {
        title: 'DXF import validation rules',
        description: 'Define validation rules for DXF health check.',
        status: 'TODO',
        priority: 'LOW',
        assignee: 'Damitha',
        module: 'validation-engine',
        projectId: validationEngine.id,
      },
      {
        title: 'Document boolean ops API',
        description: 'Write API documentation for polygon boolean operations.',
        status: 'DONE',
        priority: 'LOW',
        assignee: 'Damitha',
        module: 'shapes-core',
        projectId: geometricCore.id,
      },
    ],
  });

  await prisma.bug.createMany({
    data: [
      {
        title: 'Cutout 111 rendering inverted arc',
        description: 'Arc segments in cutout profile 111 render with inverted sweep direction.',
        severity: 'HIGH',
        status: 'RESOLVED',
        module: 'shapes-core',
        resolution: 'Fixed coordinate system normalization in ArcSweepParser.',
        assignee: 'Damitha',
        projectId: geometricCore.id,
      },
      {
        title: 'Zoom causes shape flicker',
        description: 'Shapes flicker during zoom operations on complex polygons.',
        severity: 'MEDIUM',
        status: 'OPEN',
        module: 'shape-drawer',
        assignee: 'Damitha',
        projectId: shapeDrawer.id,
      },
      {
        title: 'Nesting overlap on rotated shapes',
        description: 'Rotated shapes occasionally overlap in nesting output.',
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        module: 'nesting-engine',
        assignee: 'Damitha',
        projectId: nestingEngine.id,
      },
      {
        title: 'DXF export missing layer info',
        description: 'Exported DXF files do not include layer metadata.',
        severity: 'LOW',
        status: 'OPEN',
        module: 'opti-shapes',
        assignee: 'Damitha',
        projectId: optiShapes.id,
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        title: 'Shape Drawer Architecture',
        content: '# Shape Drawer Architecture\n\nReact + SVG rendering pipeline with GSAP animations.',
        tags: JSON.stringify(['architecture', 'frontend']),
        projectId: shapeDrawer.id,
      },
      {
        title: 'shapes-core API Reference',
        content: '# shapes-core API\n\nJava geometry library for polygon operations.',
        tags: JSON.stringify(['api', 'java']),
        projectId: geometricCore.id,
      },
      {
        title: 'Nesting Engine Design Doc',
        content: '# Nesting Engine\n\nSheet layout optimization using QuadTree spatial indexing.',
        tags: JSON.stringify(['design', 'optimization']),
        projectId: nestingEngine.id,
      },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
