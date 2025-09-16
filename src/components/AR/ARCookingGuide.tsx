import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera,
  Scan,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Eye,
  Smartphone,
  Timer,
  CheckCircle,
  Circle,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ARCookingGuideProps {
  recipe: {
    id: string;
    title: string;
    instructions: any;
    ingredients: string[];
    prep_time_minutes: number;
    cook_time_minutes: number;
  };
}

const ARCookingGuide: React.FC<ARCookingGuideProps> = ({ recipe }) => {
  const [isARActive, setIsARActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cameraPermission, setCameraPermission] = useState<'denied' | 'granted' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const steps = recipe.instructions?.steps || [];
  const totalSteps = steps.length;

  useEffect(() => {
    // Check camera permissions
    navigator.permissions.query({ name: 'camera' as PermissionName }).then((result) => {
      setCameraPermission(result.state as any);
    });
  }, []);

  const startAR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsARActive(true);
      setCameraPermission('granted');
      
      toast({
        title: "AR Mode Activated! 📱",
        description: "Point your camera at your cooking area"
      });
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use AR features",
        variant: "destructive"
      });
    }
  };

  const stopAR = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsARActive(false);
    setIsPlaying(false);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 1) / totalSteps) * 100);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress((currentStep - 1) / totalSteps * 100);
    }
  };

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex)
        ? prev.filter(s => s !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-advance steps when playing
  useEffect(() => {
    if (isPlaying && isARActive) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < totalSteps - 1) {
            const newStep = prev + 1;
            setProgress((newStep / totalSteps) * 100);
            return newStep;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 8000); // 8 seconds per step
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, isARActive, totalSteps]);

  const renderARInterface = () => (
    <div className="relative w-full h-[500px] bg-black rounded-xl overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      
      {/* AR Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Step Instructions Overlay */}
        <div className="absolute top-4 left-4 right-4">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                Step {currentStep + 1} of {totalSteps}
              </Badge>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="text-sm">~2 min</span>
              </div>
            </div>
            <p className="text-lg font-medium">
              {steps[currentStep]?.instruction || 'No instruction available'}
            </p>
          </motion.div>
        </div>

        {/* AR Detection Indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-64 h-64 border-2 border-primary/60 rounded-lg"
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white text-sm font-medium">Cooking Progress</span>
              <span className="text-white/70 text-sm">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* AR Controls */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={previousStep}
            disabled={currentStep === 0}
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={toggleAutoPlay}
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleStep(currentStep)}
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            {completedSteps.includes(currentStep) ? 
              <CheckCircle className="w-4 h-4 text-green-400" /> : 
              <Circle className="w-4 h-4" />
            }
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1}
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="bg-gradient-to-br from-background via-background/50 to-blue/5 border-blue/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AR Cooking Guide</span>
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-blue/10 text-blue-600">
                <Smartphone className="w-3 h-3 mr-1" />
                Mobile Ready
              </Badge>
              <Badge variant="outline">
                <Zap className="w-3 h-3 mr-1" />
                Real-time
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">
            Experience step-by-step cooking with augmented reality overlays
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isARActive ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ready for AR Cooking?</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Transform your kitchen into a smart cooking space with real-time step-by-step guidance
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Scan className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Step Detection</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Timer className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Smart Timing</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Volume2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Voice Guidance</p>
                  </div>
                </div>

                {cameraPermission === 'denied' ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-destructive">
                      Camera access is required for AR features. Please enable camera permissions in your browser settings.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={startAR}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start AR Cooking Mode
                  </Button>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderARInterface()}
              
              {/* Stop AR Button */}
              <div className="flex justify-center">
                <Button
                  onClick={stopAR}
                  variant="outline"
                  className="bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Stop AR Mode
                </Button>
              </div>
            </div>
          )}

          {/* Recipe Steps Preview */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Recipe Steps ({completedSteps.length}/{totalSteps} completed)
            </h4>
            <div className="grid gap-3">
              {steps.map((step: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    index === currentStep 
                      ? 'bg-primary/10 border-primary/30' 
                      : completedSteps.includes(index)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStep(index)}
                    className="flex-shrink-0 w-8 h-8 p-0"
                  >
                    {completedSteps.includes(index) ? 
                      <CheckCircle className="w-5 h-5 text-green-500" /> : 
                      <Circle className="w-5 h-5" />
                    }
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Step {index + 1}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.instruction}
                    </p>
                  </div>
                  {index === currentStep && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      Current
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ARCookingGuide;