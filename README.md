# Michael Smith Portfolio

A modern, full-stack property portfolio website built with React, TypeScript, Vite, and Express.js.

## Features

- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Fast frontend with Vite and React
- 🔐 Admin panel for content management
- 📝 Blog/Journal system with articles
- 🏠 Property listings with image uploads
- 💾 MySQL database with automated setup
- 🎬 Video support and media management
- 📱 Mobile-friendly and accessible

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion (animations)
- GSAP
- React Router DOM

**Backend:**
- Node.js
- Express.js
- MySQL2
- Multer (file uploads)
- bcryptjs (authentication)
- CORS

## Development Setup

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd michael-smith-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=highlanderstay
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

4. Start the development servers:

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Production Deployment

This project is ready to deploy to aaPanel. See the deployment guides:

- **Quick Start:** [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Fast deployment checklist
- **Full Guide:** [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment instructions

### Quick Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run deployment script (Windows):**
   ```bash
   deploy.bat
   ```
   
   Or manually prepare files from the checklist in `QUICK_DEPLOY.md`

3. **Upload to your server and follow the deployment guide**

## Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy:build` - Build and show deployment instructions

## Project Structure

```
michael-smith-portfolio/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── assets/              # Images, videos, etc.
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── dist/                    # Production build (generated)
├── uploads/                 # Uploaded files (properties, etc.)
├── server.js                # Express backend server
├── package.json             # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── ecosystem.config.cjs    # PM2 configuration for production
├── .env.example            # Environment variables template
├── DEPLOYMENT.md           # Full deployment guide
└── QUICK_DEPLOY.md         # Quick deployment checklist
```

## Database

The application automatically creates the necessary database tables on first run:

- `settings` - Site configuration and customization
- `admins` - Admin users for management panel
- `articles` - Blog posts and journal entries
- `properties` - Property listings (if applicable)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `` |
| `DB_NAME` | Database name | `highlanderstay` |
| `DB_PORT` | MySQL port | `3306` |
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## Admin Panel

Access the admin panel to manage:
- Site settings and branding
- Banners and promotional content
- Articles and blog posts
- Property listings
- Media uploads

Default admin credentials are set up during initial database seeding (check server.js for details).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For deployment help or issues:
1. Check [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for common solutions
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed troubleshooting
3. Check PM2 logs: `pm2 logs`
4. Check server logs in the `logs/` directory

## Acknowledgments

- Built with ❤️ using modern web technologies
- Deployed on aaPanel for easy server management
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
