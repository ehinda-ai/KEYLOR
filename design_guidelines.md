# Design Guidelines: Agence Immobilière Haut de Gamme

## Design Approach: Luxury Real Estate Reference

**Selected References:** Sotheby's International Realty, Christie's Real Estate, Airbnb Luxe
**Core Principle:** Timeless elegance meets modern functionality - every element should convey exclusivity and sophistication

## Color Palette

**Light Mode:**
- Primary: 0 0% 8% (Rich charcoal black) - Headers, key text
- Secondary: 30 25% 15% (Deep warm brown) - Subheadings, accents
- Accent: 38 45% 55% (Muted gold/champagne) - CTAs, highlights, borders
- Background: 30 15% 97% (Warm off-white) - Main background
- Surface: 0 0% 100% (Pure white) - Cards, elevated surfaces
- Text: 0 0% 20% (Dark charcoal) - Body text

**Dark Mode:**
- Primary: 30 8% 95% (Warm ivory) - Headers, key text  
- Secondary: 38 35% 75% (Light champagne) - Subheadings
- Accent: 38 55% 65% (Bright gold) - CTAs, highlights
- Background: 0 0% 10% (Deep black) - Main background
- Surface: 0 0% 15% (Elevated black) - Cards, panels
- Text: 30 5% 85% (Warm gray) - Body text

## Typography

**Font Families (via Google Fonts):**
- Display/Headings: 'Playfair Display' (serif) - Conveys luxury and tradition
- Body/UI: 'Inter' (sans-serif) - Modern, highly readable

**Scale:**
- Hero: text-6xl md:text-7xl lg:text-8xl font-serif font-light
- H1: text-4xl md:text-5xl font-serif font-normal
- H2: text-3xl md:text-4xl font-serif font-light
- H3: text-xl md:text-2xl font-serif font-normal
- Body: text-base leading-relaxed
- Small/Meta: text-sm tracking-wide uppercase (for property details)

## Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 20, 24, 32
- Component padding: p-6 md:p-8 lg:p-12
- Section spacing: py-16 md:py-24 lg:py-32
- Grid gaps: gap-8 md:gap-12
- Container: max-w-7xl mx-auto px-6 md:px-8

**Grid Strategy:**
- Property cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Featured properties: Asymmetric masonry layout with varying card heights
- Property details: 2-column split on desktop (images | info)
- Filters sidebar: 1/4 width on desktop, drawer on mobile

## Component Library

**Navigation:**
- Fixed header with subtle backdrop blur (backdrop-blur-md)
- Logo left, main nav center, language/CTA right
- Border-bottom with accent color on scroll
- Mega menu for property types dropdown

**Property Cards:**
- Large image with 16:10 aspect ratio
- Subtle hover lift (translate-y-[-4px])
- Overlay gradient on image for text readability
- Price in accent gold, prominent and large
- Property type badge (uppercase, small, border)
- Heart icon for favorites (outline → filled interaction)

**Filters Panel:**
- Elegant dropdown selects with custom styling
- Range sliders with accent gold track
- Checkbox groups with refined spacing
- Sticky on desktop scroll

**Call-to-Actions:**
- Primary: Solid accent gold background, dark text, subtle shadow
- Secondary: Outline with accent border, backdrop blur when over images
- Text-only: Underline animation on hover
- Always include arrow or icon for directional cues

**Forms:**
- Generous input padding (p-4)
- Border with subtle shadow on focus
- Floating labels for elegance
- Contact form: 2-column layout (name/email | phone/subject, message full-width)
- Appointment booking: Date picker with calendar modal, time slot selection grid

**Property Detail Page:**
- Full-width hero gallery (carousel with thumbnails)
- Sticky sidebar with price, key stats, contact form
- Tabbed sections: Description | Caractéristiques | Localisation | Visite Virtuelle
- Agent card with photo and contact options

**Data Displays:**
- Property stats: Icon + label + value in minimal cards
- Comparison table for similar properties
- Map integration with custom marker styling

## Images

**Required Images:**
- **Hero Section:** Full-width luxury property showcase (modern villa or prestigious apartment with stunning view), 1920x800px minimum, high-quality architectural photography
- **Property Listings:** Professional real estate photos for each listing, 1200x750px, variety of interiors, exteriors, and details
- **About Section:** Team photos in professional attire, office exterior/interior shots showcasing luxury
- **Testimonial Section:** Client photos (optional, can use initials in elegant circles)
- **Footer/Contact:** Office location photo or city skyline

**Image Treatment:**
- Slight desaturation for consistency (-10% saturation)
- Subtle vignette on hero images for text overlay
- Lazy loading with elegant skeleton placeholders
- WebP format with fallbacks

## Page Structure

**Homepage:**
1. Hero: Full-width luxury property image, elegant tagline, search bar overlay, scroll indicator
2. Featured Properties: 3-card showcase with "Biens d'Exception" heading
3. Services: 3-column grid (Achat | Vente | Estimation) with icons
4. Portfolio Numbers: Stats in elegant presentation (200+ biens vendus, 15 ans d'expérience)
5. Quartiers: Neighborhood showcase with image cards
6. Testimonials: 2-column elegant quotes with client names
7. CTA: Full-width contact section with form + office info
8. Footer: Rich footer with sitemap, social, newsletter

**Catalog Page:**
- Filters sidebar/drawer with advanced options
- Sorting dropdown (Prix | Date | Surface)
- Results grid with property cards
- Pagination with elegant page numbers

**Property Detail:**
- Immersive photo gallery
- Comprehensive property information
- Virtual tour embed
- Similar properties carousel
- Contact agent sticky section

## Animation Guidelines

**Use Sparingly:**
- Subtle fade-in on scroll for sections (duration-500)
- Property card hover lift
- Button hover states (scale-[1.02])
- Page transitions: Elegant fade only

**Avoid:**
- Parallax effects
- Complex scroll-triggered animations
- Carousel auto-play (user-controlled only)

## Accessibility

- Maintain WCAG AA contrast ratios (gold on white/black passes)
- Focus states with accent gold ring
- Keyboard navigation for filters and galleries
- Alt text for all property images with descriptive details
- Dark mode that's equally functional and elegant