# World Labs 3D Generator

A Next.js app that generates immersive 3D scenes using the World Labs API and renders them in the browser using Gaussian Splatting (SparkJS).

## Features

- **Text-to-3D**: Generate 3D scenes from text descriptions
- **Image-to-3D**: Upload an image to convert it into a 3D world
- **In-browser rendering**: View generated scenes directly in your browser
- **Camera controls**: Drag to rotate, scroll to zoom, right-click to pan
- **Draft mode**: Fast generation (~30-45s) for iteration

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- World Labs API key ([Get one here](https://platform.worldlabs.ai/api-keys))

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. Enter your World Labs API key (saved to browser storage)
2. Either:
   - Enter a text prompt describing your scene, OR
   - Upload an image to convert to 3D
3. Click "Generate World" and wait for generation
4. Explore the 3D scene in the viewer

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **SparkJS** - Gaussian splat rendering
- **Three.js** - 3D graphics
- **World Labs API** - 3D scene generation

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate` | POST | Start world generation |
| `/api/status/[operationId]` | GET | Check generation status |
| `/api/upload/prepare` | POST | Prepare image upload |
| `/api/world/[worldId]` | GET | Fetch existing world |

## License

MIT
