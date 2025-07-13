# Slimbooks

A comprehensive billing and invoice management application built with React, TypeScript, and modern web technologies. Streamline your business operations with powerful client management, invoice generation, expense tracking, and financial reporting capabilities.

## ✨ Features

### 📊 Dashboard & Analytics
- **Real-time Overview**: Monitor key business metrics at a glance
- **Revenue Trends**: Track revenue patterns with interactive charts
- **Financial Insights**: View MRR (Monthly Recurring Revenue), invoice statistics, and expense summaries

### 👥 Client Management
- **Complete Client Profiles**: Store detailed client information including contact details, addresses, and company information
- **Stripe Integration Ready**: Built-in support for Stripe customer management
- **Search & Filter**: Quickly find clients with powerful search and filtering capabilities
- **Bulk Operations**: Efficiently manage multiple clients

### 🧾 Invoice Management
- **Professional Invoices**: Create beautiful, customizable invoices with line items, taxes, and shipping
- **Multiple Templates**: Choose from various invoice templates and themes
- **Recurring Invoices**: Set up automated recurring billing for subscription-based services
- **Invoice Tracking**: Monitor invoice status (draft, sent, paid) with real-time updates
- **PDF Generation**: Generate professional PDF invoices for clients

### 🔄 Recurring Billing
- **Template Management**: Create and manage recurring invoice templates
- **Flexible Scheduling**: Support for weekly, monthly, quarterly, and yearly billing cycles
- **Automated Processing**: Automatic generation of invoices based on schedules
- **MRR Tracking**: Monitor Monthly Recurring Revenue and subscription metrics

### 💰 Expense Management
- **Expense Tracking**: Record and categorize business expenses
- **Receipt Management**: Upload and store receipt images
- **Status Workflow**: Track expenses through pending, approved, and reimbursed states
- **Reporting**: Generate detailed expense reports for accounting

### 📈 Reports & Analytics
- **Financial Reports**: Comprehensive revenue and expense reporting
- **Date Range Filtering**: Analyze data across custom time periods
- **Export Capabilities**: Export reports for external analysis
- **Visual Charts**: Interactive charts and graphs for data visualization

### ⚙️ Settings & Customization
- **Theme Support**: Light and dark mode with system preference detection
- **Company Branding**: Customize invoices with company logos and information
- **Date/Time Formatting**: Configurable date and time display preferences
- **Invoice Templates**: Multiple professional invoice template options

## 🚀 Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme system
- **Routing**: React Router v6 for navigation
- **State Management**: React Query for server state management
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date manipulation
- **Form Management**: React Hook Form with Zod validation

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git for version control

### Quick Start

```bash
# Clone the repository
git clone <your-repository-url>
cd slimbooks

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run start
```

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── invoices/        # Invoice-related components
│   ├── expenses/        # Expense management components
│   ├── reports/         # Reporting components
│   └── settings/        # Settings and configuration
├── contexts/            # React contexts (Auth, Theme)
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and database operations
├── pages/               # Page components
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

## 🎨 Theme System

The application features a comprehensive theme system supporting both light and dark modes:

- **CSS Custom Properties**: Semantic color variables that adapt to theme changes
- **Consistent Design**: Dashboard-inspired design patterns across all components
- **Accessibility**: High contrast ratios and proper color semantics
- **Customizable**: Easy to extend and modify theme variables

See [THEME_SYSTEM.md](./THEME_SYSTEM.md) for detailed documentation.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Add your environment-specific variables here
VITE_APP_NAME=Slimbooks
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
```

### Database

The application currently uses localStorage for data persistence, making it perfect for:
- Development and testing
- Small business use cases
- Offline-first applications

For production use, consider integrating with:
- Stripe for payment processing
- PostgreSQL or MySQL for data persistence
- Firebase or Supabase for backend services

## 📱 Features in Detail

### Invoice Generation
- **Line Items**: Add multiple products/services with quantities and rates
- **Tax Calculation**: Automatic tax calculation with customizable rates
- **Shipping Costs**: Include shipping and handling fees
- **Professional Templates**: Multiple invoice designs to choose from
- **Company Branding**: Add logos and company information

### Recurring Billing
- **Template System**: Create reusable invoice templates
- **Flexible Schedules**: Weekly, monthly, quarterly, yearly billing
- **Automatic Processing**: Background processing of recurring invoices
- **MRR Analytics**: Track Monthly Recurring Revenue growth

### Client Management
- **Complete Profiles**: Store all client information in one place
- **Communication History**: Track interactions and invoice history
- **Search & Filter**: Powerful search across all client data
- **Export Capabilities**: Export client data for external use

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on:
- Code of conduct
- Development workflow
- Pull request process
- Coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive docs and theme system guide
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our community discussions

## 🗺️ Roadmap

- [ ] Stripe payment integration
- [ ] Email invoice delivery
- [ ] Multi-currency support
- [ ] Advanced reporting dashboard
- [ ] Mobile app development
- [ ] API development for third-party integrations
- [ ] Multi-tenant support
- [ ] Advanced user permissions

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- Icons provided by [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for small businesses and freelancers**