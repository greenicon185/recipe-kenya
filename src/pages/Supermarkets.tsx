import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Phone, Clock, Info } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface Supermarket {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  locations: {
    name: string;
    address: string;
    phone: string;
    hours: string;
  }[];
  features: string[];
}

const supermarkets: Supermarket[] = [
  {
    id: '1',
    name: 'Nakumatt',
    logo: 'https://www.nakumatt.co.ke/wp-content/uploads/2023/01/nakumatt-logo.png',
    website: 'https://www.nakumatt.co.ke',
    description: 'One of Kenya\'s largest retail chains offering a wide range of products.',
    locations: [
      {
        name: 'Nakumatt Mega',
        address: 'Mombasa Road, Nairobi',
        phone: '+254 20 1234567',
        hours: 'Mon-Sun: 8:00 AM - 9:00 PM'
      },
      {
        name: 'Nakumatt Junction',
        address: 'Ngong Road, Nairobi',
        phone: '+254 20 2345678',
        hours: 'Mon-Sun: 8:00 AM - 9:00 PM'
      }
    ],
    features: [
      'Wide range of products',
      'Online shopping',
      'Home delivery',
      'Loyalty program',
      'Fresh produce section'
    ]
  },
  {
    id: '2',
    name: 'Tuskys',
    logo: 'https://www.tuskys.com/wp-content/uploads/2023/01/tuskys-logo.png',
    website: 'https://www.tuskys.com',
    description: 'Kenyan retail chain known for quality products and competitive prices.',
    locations: [
      {
        name: 'Tuskys Supermarket',
        address: 'Tom Mboya Street, Nairobi',
        phone: '+254 20 3456789',
        hours: 'Mon-Sun: 7:00 AM - 8:00 PM'
      },
      {
        name: 'Tuskys Mega',
        address: 'Thika Road, Nairobi',
        phone: '+254 20 4567890',
        hours: 'Mon-Sun: 7:00 AM - 8:00 PM'
      }
    ],
    features: [
      'Competitive prices',
      'Weekly deals',
      'Bulk buying options',
      'Fresh bakery',
      'Butcher section'
    ]
  },
  {
    id: '3',
    name: 'Naivas',
    logo: 'https://www.naivas.co.ke/wp-content/uploads/2023/01/naivas-logo.png',
    website: 'https://www.naivas.co.ke',
    description: 'Fast-growing Kenyan supermarket chain with a focus on customer service.',
    locations: [
      {
        name: 'Naivas Supermarket',
        address: 'Kimathi Street, Nairobi',
        phone: '+254 20 5678901',
        hours: 'Mon-Sun: 7:30 AM - 8:30 PM'
      },
      {
        name: 'Naivas Mega',
        address: 'Mombasa Road, Nairobi',
        phone: '+254 20 6789012',
        hours: 'Mon-Sun: 7:30 AM - 8:30 PM'
      }
    ],
    features: [
      '24/7 customer service',
      'Mobile app',
      'Price matching',
      'Fresh produce',
      'International products'
    ]
  },
  {
    id: '4',
    name: 'Carrefour',
    logo: 'https://www.carrefour.co.ke/wp-content/uploads/2023/01/carrefour-logo.png',
    website: 'https://www.carrefour.co.ke',
    description: 'International retail chain with a strong presence in Kenya.',
    locations: [
      {
        name: 'Carrefour Two Rivers',
        address: 'Two Rivers Mall, Nairobi',
        phone: '+254 20 7890123',
        hours: 'Mon-Sun: 9:00 AM - 10:00 PM'
      },
      {
        name: 'Carrefour Village Market',
        address: 'Village Market, Nairobi',
        phone: '+254 20 8901234',
        hours: 'Mon-Sun: 9:00 AM - 10:00 PM'
      }
    ],
    features: [
      'International brands',
      'Premium products',
      'Online shopping',
      'Home delivery',
      'International payment options'
    ]
  },
  {
    id: '5',
    name: 'Chandarana',
    logo: 'https://www.chandarana.co.ke/wp-content/uploads/2023/01/chandarana-logo.png',
    website: 'https://www.chandarana.co.ke',
    description: 'Premium supermarket chain offering high-quality products.',
    locations: [
      {
        name: 'Chandarana ABC Place',
        address: 'ABC Place, Nairobi',
        phone: '+254 20 9012345',
        hours: 'Mon-Sun: 8:00 AM - 9:00 PM'
      },
      {
        name: 'Chandarana Lavington',
        address: 'Lavington Mall, Nairobi',
        phone: '+254 20 0123456',
        hours: 'Mon-Sun: 8:00 AM - 9:00 PM'
      }
    ],
    features: [
      'Premium products',
      'Organic section',
      'International cuisine',
      'Gourmet foods',
      'Specialty items'
    ]
  },
  {
    id: '6',
    name: 'Quickmart',
    logo: 'https://www.quickmart.co.ke/wp-content/uploads/2023/01/quickmart-logo.png',
    website: 'https://www.quickmart.co.ke',
    description: 'Modern retail chain with a focus on convenience and value.',
    locations: [
      {
        name: 'Quickmart Thika Road',
        address: 'Thika Road Mall, Nairobi',
        phone: '+254 20 1234567',
        hours: 'Mon-Sun: 7:00 AM - 8:00 PM'
      },
      {
        name: 'Quickmart Buruburu',
        address: 'Buruburu Shopping Centre, Nairobi',
        phone: '+254 20 2345678',
        hours: 'Mon-Sun: 7:00 AM - 8:00 PM'
      }
    ],
    features: [
      'Quick checkout',
      'Value deals',
      'Convenience items',
      'Fresh produce',
      'Local products'
    ]
  }
];

const Supermarkets = () => {
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Kenyan Supermarkets</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supermarkets.map((supermarket) => (
              <div
                key={supermarket.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
                onClick={() => setSelectedSupermarket(supermarket)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <img
                      src={supermarket.logo}
                      alt={supermarket.name}
                      className="h-12 object-contain"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(supermarket.website, '_blank');
                      }}
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-primary hover:text-primary/80 transition-colors">
                    {supermarket.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{supermarket.description}</p>
                  <div className="flex justify-end">
                    <Button
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(supermarket.website, '_blank');
                      }}
                    >
                      Shop Online
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Supermarket Details Dialog */}
      <Dialog open={!!selectedSupermarket} onOpenChange={() => setSelectedSupermarket(null)}>
        <DialogContent className="max-w-3xl">
          {selectedSupermarket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-primary">
                  <img
                    src={selectedSupermarket.logo}
                    alt={selectedSupermarket.name}
                    className="h-8 object-contain"
                  />
                  <span className="text-2xl font-bold">{selectedSupermarket.name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">About</h3>
                  <p className="text-gray-600">{selectedSupermarket.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Locations</h3>
                  <div className="grid gap-4">
                    {selectedSupermarket.locations.map((location, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="font-medium mb-2 text-primary">{location.name}</h4>
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-primary/70" />
                            {location.address}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-primary/70" />
                            {location.phone}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-primary/70" />
                            {location.hours}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSupermarket.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Info className="h-4 w-4 text-primary/70" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedSupermarket.website, '_blank')}
                  >
                    Visit Website
                  </Button>
                  <Button
                    onClick={() => window.open(selectedSupermarket.website, '_blank')}
                  >
                    Shop Online
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Supermarkets;
