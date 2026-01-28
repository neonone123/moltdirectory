# MoltDirectory 🦞

The largest community-curated directory of pre-built skills and personas for [MoltBot](https://molt.bot). Find the logic you need to make your agent smarter, faster.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

- **400+ Skills** across 25+ categories
- **Fast Search** with keyboard shortcuts (⌘K)
- **Dark/Light Mode** with persistent theme preferences
- **Static Generation** - No server required, works anywhere
- **Mobile Responsive** design

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/moltdirectory.git
cd moltdirectory

# Install dependencies
npm install

# Build the site
node build.js
```

### Development

The site is static HTML/CSS/JS. After building, simply open `index.html` in your browser or serve with any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## 📁 Project Structure

```
moltdirectory/
├── build.js          # Static site generator
├── style.css         # Global styles with CSS variables
├── index.html        # Generated homepage
├── package.json      # Dependencies and scripts
├── [category]/       # Generated category pages
│   └── [skill]/      # Generated skill detail pages
└── start-here/       # Getting started guide
```

## 🔧 How It Works

The build script (`build.js`) fetches the skill registry from the [Awesome MoltBot Skills](https://github.com/VoltAgent/awesome-moltbot-skills) repository and generates:

1. **Homepage** with category grid and search
2. **Category pages** listing skills in each category
3. **Skill pages** with full documentation pulled from GitHub

## 🎨 Customization

### Themes

The site supports dark (default) and light themes. Colors are defined as CSS variables in `style.css`:

```css
:root {
  --bg-primary: #0a0e17;
  --accent: #3b82f6;
  /* ... */
}

[data-theme="light"] {
  --bg-primary: #faf7f2;
  --accent: #b45309;
  /* ... */
}
```

### Adding Category Icons

Edit the `icons` object in `build.js` to add SVG icons for new categories.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue describing the problem
2. **Suggest Features** - Open an issue with your idea
3. **Submit PRs** - Fork, make changes, and submit a pull request

### Development Guidelines

- Follow existing code style
- Test changes locally before submitting
- Update documentation if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MoltBot](https://molt.bot) team for the amazing platform
- [Awesome MoltBot Skills](https://github.com/VoltAgent/awesome-moltbot-skills) community
- All skill authors who contribute to the ecosystem

---

**Disclaimer**: MoltDirectory is a community-run project and is not affiliated with the official MoltBot team or Peter Steinberger. We are just fans of the lobster. 🦞
