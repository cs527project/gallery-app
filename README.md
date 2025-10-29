# Peak Moments - Mountaineering Photography Landing Page
tst


A modern, responsive landing page designed to showcase mountaineering photography with a fluid, professional design inspired by high-end portfolio sites.

## Features

### 🏔️ **Design & Layout**
- **Hero Section**: Full-screen parallax background with compelling call-to-action
- **Featured Expeditions**: Grid layout highlighting your best work
- **Portfolio Gallery**: Filterable image gallery with categories
- **About Section**: Professional storytelling with statistics
- **Contact Form**: Clean, functional contact interface
- **Responsive Design**: Perfect on all devices from mobile to desktop

### 🎨 **Visual Elements**
- **Modern Typography**: Playfair Display for headings, Inter for body text
- **Smooth Animations**: Scroll-triggered animations and hover effects
- **Lightbox Gallery**: Click images to view in full-screen lightbox
- **Parallax Effects**: Subtle parallax scrolling for depth
- **Color Scheme**: Professional mountain-inspired palette

### 🚀 **Interactive Features**
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Gallery Filtering**: Filter photos by category (Peaks, Climbing, Landscape)
- **Smooth Scrolling**: Seamless navigation between sections
- **Contact Form**: Form submission with validation
- **Progress Indicator**: Scroll progress bar at top of page
- **Animated Statistics**: Counter animations for impressive numbers

## File Structure

```
gallery-app/
├── index.html          # Main HTML structure
├── styles.css          # All CSS styling and responsive design
├── script.js           # JavaScript functionality and interactions
└── README.md          # This documentation file
```

## Customization Guide

### 🖼️ **Replacing Images**

The current site uses Unsplash placeholder images. To use your own photos:

1. **Replace image URLs** in `index.html`:
   - Hero background (line ~119)
   - Featured expedition images (lines ~56, 63, 70)
   - Gallery images (lines ~89, 96, 103, etc.)
   - About section image (line ~173)

2. **Image requirements**:
   - **Hero**: 2070x1380px or larger for best quality
   - **Gallery**: 800x800px (square) for consistent layout
   - **Featured**: Various sizes (large: 2070x1380, others: 800x600)
   - **Format**: JPG or WebP for best performance

### 📝 **Content Customization**

#### **Branding & Contact**
- **Site title**: Change "Peak Moments" in navigation and footer
- **Contact details**: Update email, phone, and location in contact section
- **Social links**: Add your actual social media URLs in footer

#### **About Section**
- **Statistics**: Update expedition count, countries visited, highest summit
- **Bio text**: Replace with your personal mountaineering story
- **Achievements**: Add your specific accomplishments

#### **Gallery Categories**
To add/modify categories:
1. Update filter buttons in HTML (lines ~77-80)
2. Add corresponding `data-category` to gallery items
3. Update filter JavaScript logic if needed

### 🎨 **Styling Customization**

#### **Color Scheme**
Edit CSS variables in `styles.css` (lines 8-19):
```css
:root {
    --primary-color: #2c3e50;    /* Main dark color */
    --accent-color: #f39c12;     /* Orange accent */
    --text-color: #333;          /* Body text */
    /* ... other colors */
}
```

#### **Typography**
- **Headings**: Playfair Display (serif, elegant)
- **Body**: Inter (sans-serif, clean)
- **Change fonts**: Update Google Fonts link in HTML head

#### **Layout Adjustments**
- **Container width**: Modify `.container` max-width (line 33)
- **Section spacing**: Adjust padding in section classes
- **Grid layouts**: Modify grid-template-columns for different layouts

### 📱 **Responsive Breakpoints**

The site is responsive with breakpoints at:
- **768px**: Tablet and below
- **480px**: Mobile phones

Customize breakpoints in the media queries section of `styles.css`.

## Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile browsers**: iOS Safari, Chrome Mobile
- **Features used**: CSS Grid, Flexbox, Intersection Observer

## Performance Tips

1. **Optimize images**: Use WebP format and compress images
2. **Lazy loading**: Already implemented for below-fold images
3. **CDN**: Consider using a CDN for images
4. **Minification**: Minify CSS and JS for production

## Deployment

### **Simple Hosting**
Upload all files to any web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Traditional web hosting

### **Domain Setup**
1. Point your domain to the hosting service
2. Update contact information in the site
3. Set up SSL certificate (usually automatic)

## Advanced Features

### **Adding a Blog Section**
To add a blog/expedition journal:
1. Create new HTML section after gallery
2. Add blog post cards with excerpts
3. Link to individual blog post pages

### **Contact Form Backend**
The current form is frontend-only. To make it functional:
1. Use services like Formspree, Netlify Forms, or EmailJS
2. Add form action URL to the form element
3. Update JavaScript to handle real submissions

### **SEO Optimization**
- Add meta descriptions and keywords
- Include Open Graph tags for social sharing
- Create XML sitemap
- Add structured data for photography business

## Troubleshooting

### **Images not loading**
- Check image URLs are accessible
- Verify file paths are correct
- Ensure CORS headers if loading from external domains

### **Mobile menu not working**
- Check JavaScript console for errors
- Verify hamburger click event is bound
- Ensure CSS classes are properly named

### **Animations not smooth**
- Check browser compatibility
- Reduce motion for accessibility (prefers-reduced-motion)
- Optimize large images that might cause lag

## Support

For issues or questions about customizing this template:
1. Check browser console for JavaScript errors
2. Validate HTML and CSS syntax
3. Test on different devices and browsers

---

**Built with ❤️ for mountaineering photographers**

*Capture the summit, share the journey, inspire the adventure.* 
