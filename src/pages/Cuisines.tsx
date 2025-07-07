
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCuisines, Cuisine } from "@/services/recipeService";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Cuisines = () => {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        const data = await getCuisines();
        setCuisines(data);
      } catch (error) {
        console.error('Error fetching cuisines:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCuisines();
  }, []);
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            <section className="mb-12">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            
            <section>
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Explore Cuisines</h1>
          <p className="text-gray-600 mb-8">Discover recipes from different culinary traditions</p>
          
          {/* Kenyan Cuisines */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-green-600 h-6 w-2 rounded mr-3"></span>
              Kenyan Local Cuisines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cuisines.filter(cuisine => cuisine.is_kenyan_local).map((cuisine) => (
                <Link key={cuisine.id} to={`/cuisine/${cuisine.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={cuisine.image_url || "https://images.unsplash.com/photo-1544025162-d76694265947?w=400"}
                        alt={cuisine.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{cuisine.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{cuisine.description}</p>
                      <p className="text-xs text-green-600 font-medium">{cuisine.origin_country}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
          
          {/* International Cuisines */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="bg-blue-600 h-6 w-2 rounded mr-3"></span>
              International Cuisines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cuisines.filter(cuisine => !cuisine.is_kenyan_local).map((cuisine) => (
                <Link key={cuisine.id} to={`/cuisine/${cuisine.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={cuisine.image_url || "https://images.unsplash.com/photo-1544025162-d76694265947?w=400"}
                        alt={cuisine.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{cuisine.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{cuisine.description}</p>
                      <p className="text-xs text-blue-600 font-medium">{cuisine.origin_country}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Cuisines;
