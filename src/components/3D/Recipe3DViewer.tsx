import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Box, Cylinder, Cone } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VolumeX, Volume2, Expand, RotateCcw, Zap, Eye } from 'lucide-react';
import * as THREE from 'three';

interface Recipe3DViewerProps {
  recipe: {
    id: string;
    title: string;
    ingredients: string[];
    instructions: any;
    prep_time_minutes: number;
    cook_time_minutes: number;
    difficulty: string;
  };
}

// 3D Ingredient Component
const Ingredient3D = ({ position, type, label, color = '#ff6b6b' }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const getGeometry = () => {
    switch (type) {
      case 'vegetable': return <Sphere args={[0.3]} />;
      case 'meat': return <Box args={[0.4, 0.3, 0.2]} />;
      case 'spice': return <Cylinder args={[0.1, 0.1, 0.4]} />;
      case 'liquid': return <Cone args={[0.2, 0.5]} />;
      default: return <Sphere args={[0.2]} />;
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        {getGeometry()}
        <meshStandardMaterial
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {hovered && (
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// 3D Cooking Process Animation
const CookingProcess = ({ step, isActive }: { step: any; isActive: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current && isActive) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.5]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={isActive ? '#00ff88' : '#333333'}
          emissive={isActive ? '#00ff88' : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
          transparent
          opacity={0.7}
        />
      </Sphere>
      <Text
        position={[0, 0, 0.6]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {step.instruction}
      </Text>
    </group>
  );
};

// Main 3D Scene
const Recipe3DScene = ({ recipe, currentStep, viewMode }: any) => {
  const ingredients = recipe.ingredients || [];
  
  const getIngredientType = (ingredient: string) => {
    const lower = ingredient.toLowerCase();
    if (lower.includes('meat') || lower.includes('beef') || lower.includes('chicken')) return 'meat';
    if (lower.includes('water') || lower.includes('oil') || lower.includes('milk')) return 'liquid';
    if (lower.includes('pepper') || lower.includes('salt') || lower.includes('spice')) return 'spice';
    return 'vegetable';
  };

  const getIngredientColor = (type: string) => {
    switch (type) {
      case 'meat': return '#8B4513';
      case 'vegetable': return '#228B22';
      case 'spice': return '#DAA520';
      case 'liquid': return '#4169E1';
      default: return '#FF6347';
    }
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
      
      {viewMode === 'ingredients' && ingredients.map((ingredient: string, index: number) => {
        const type = getIngredientType(ingredient);
        const angle = (index / ingredients.length) * Math.PI * 2;
        const radius = 3;
        const position: [number, number, number] = [
          Math.cos(angle) * radius,
          Math.sin(index * 0.5) * 0.5,
          Math.sin(angle) * radius
        ];
        
        return (
          <Ingredient3D
            key={index}
            position={position}
            type={type}
            label={ingredient}
            color={getIngredientColor(type)}
          />
        );
      })}

      {viewMode === 'process' && recipe.instructions?.steps?.map((step: any, index: number) => (
        <CookingProcess
          key={index}
          step={step}
          isActive={index === currentStep}
        />
      ))}

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
};

const Recipe3DViewer: React.FC<Recipe3DViewerProps> = ({ recipe }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'ingredients' | 'process'>('ingredients');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const steps = recipe.instructions?.steps || [];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  React.useEffect(() => {
    if (isPlaying && viewMode === 'process') {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, viewMode, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full h-[600px] relative"
    >
      <Card className="h-full bg-gradient-to-br from-background via-background/50 to-primary/5 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🥘 3D Recipe Visualization
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Zap className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                Interactive
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="h-[500px] p-6">
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="ingredients">3D Ingredients</TabsTrigger>
              <TabsTrigger value="process">Cooking Process</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ingredients" className="h-[420px] relative">
              <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
                <Canvas camera={{ position: [5, 5, 5], fov: 60 }}>
                  <Suspense fallback={null}>
                    <Recipe3DScene recipe={recipe} viewMode="ingredients" />
                  </Suspense>
                </Canvas>
                <div className="absolute bottom-4 left-4 text-white/80 text-sm">
                  🔄 Drag to rotate • 🔍 Scroll to zoom • Hover ingredients for details
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="process" className="h-[420px] relative">
              <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
                <Canvas camera={{ position: [3, 3, 3], fov: 60 }}>
                  <Suspense fallback={null}>
                    <Recipe3DScene recipe={recipe} currentStep={currentStep} viewMode="process" />
                  </Suspense>
                </Canvas>
                
                {/* Process Controls */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          ←
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleAutoPlay}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={nextStep}
                          disabled={currentStep === steps.length - 1}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          →
                        </Button>
                      </div>
                    </div>
                    <div className="text-white/90 text-sm">
                      {steps[currentStep]?.instruction || 'No instruction available'}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Recipe3DViewer;