import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Thermometer,
  Timer,
  Zap,
  Wifi,
  WifiOff,
  Plus,
  Settings,
  ChefHat,
  Flame,
  Snowflake,
  Scale,
  Clock,
  Battery,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SmartDevice {
  id: string;
  device_name: string;
  device_type: string;
  device_data: any;
  is_connected: boolean;
  last_sync: string;
}

const SmartKitchenDashboard: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_kitchen_devices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      toast({
        title: "Error",
        description: "Failed to load smart devices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async (deviceData: any) => {
    try {
      const { error } = await supabase
        .from('smart_kitchen_devices')
        .insert({
          user_id: user?.id,
          device_name: deviceData.name,
          device_type: deviceData.type,
          device_data: deviceData.settings,
          is_connected: true
        });

      if (error) throw error;
      
      await fetchDevices();
      setIsAddingDevice(false);
      
      toast({
        title: "Device Added! 🔗",
        description: `${deviceData.name} is now connected to your smart kitchen`
      });
    } catch (error: any) {
      toast({
        title: "Failed to Add Device",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateDeviceSettings = async (deviceId: string, newData: any) => {
    try {
      const { error } = await supabase
        .from('smart_kitchen_devices')
        .update({ 
          device_data: newData,
          last_sync: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (error) throw error;
      
      await fetchDevices();
      
      toast({
        title: "Settings Updated",
        description: "Device settings have been synchronized"
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleDeviceConnection = async (deviceId: string, isConnected: boolean) => {
    try {
      const { error } = await supabase
        .from('smart_kitchen_devices')
        .update({ 
          is_connected: !isConnected,
          last_sync: new Date().toISOString()
        })
        .eq('id', deviceId);

      if (error) throw error;
      await fetchDevices();
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'oven': return <ChefHat className="w-6 h-6" />;
      case 'stove': return <Flame className="w-6 h-6" />;
      case 'refrigerator': return <Snowflake className="w-6 h-6" />;
      case 'scale': return <Scale className="w-6 h-6" />;
      case 'thermometer': return <Thermometer className="w-6 h-6" />;
      case 'timer': return <Timer className="w-6 h-6" />;
      case 'air_fryer': return <Zap className="w-6 h-6" />;
      case 'pressure_cooker': return <Clock className="w-6 h-6" />;
      default: return <Settings className="w-6 h-6" />;
    }
  };

  const getDeviceColor = (type: string) => {
    switch (type) {
      case 'oven': return 'text-orange-500';
      case 'stove': return 'text-red-500';
      case 'refrigerator': return 'text-blue-500';
      case 'scale': return 'text-green-500';
      case 'thermometer': return 'text-purple-500';
      case 'timer': return 'text-yellow-500';
      case 'air_fryer': return 'text-indigo-500';
      case 'pressure_cooker': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  const DeviceCard = ({ device }: { device: SmartDevice }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card className={`cursor-pointer transition-all duration-200 ${
        device.is_connected 
          ? 'bg-gradient-to-br from-background to-primary/5 border-primary/20' 
          : 'bg-muted/50 border-muted'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${device.is_connected ? 'bg-primary/10' : 'bg-muted'}`}>
                <span className={getDeviceColor(device.device_type)}>
                  {getDeviceIcon(device.device_type)}
                </span>
              </div>
              <div>
                <CardTitle className="text-lg">{device.device_name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {device.device_type.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {device.is_connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <Switch
                checked={device.is_connected}
                onCheckedChange={() => toggleDeviceConnection(device.id, device.is_connected)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Device Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={device.is_connected ? "default" : "secondary"}>
                {device.is_connected ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>

            {/* Device-specific controls */}
            {device.is_connected && (
              <DeviceControls 
                device={device} 
                onUpdate={(newData) => updateDeviceSettings(device.id, newData)}
              />
            )}

            {/* Last sync */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last sync</span>
              <span>{new Date(device.last_sync).toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const DeviceControls = ({ device, onUpdate }: { device: SmartDevice; onUpdate: (data: any) => void }) => {
    const data = device.device_data || {};

    switch (device.device_type) {
      case 'oven':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Temperature: {data.temperature || 180}°C</Label>
              <Slider
                value={[data.temperature || 180]}
                onValueChange={([temp]) => onUpdate({ ...data, temperature: temp })}
                max={250}
                min={50}
                step={10}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Preheat</span>
              <Switch
                checked={data.preheating || false}
                onCheckedChange={(preheating) => onUpdate({ ...data, preheating })}
              />
            </div>
          </div>
        );

      case 'timer':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-mono">
                {data.timeRemaining || '00:00'}
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdate({ ...data, isRunning: !data.isRunning })}
              >
                {data.isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdate({ ...data, timeRemaining: '00:00', isRunning: false })}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );

      case 'scale':
        return (
          <div className="text-center">
            <div className="text-xl font-semibold">
              {data.weight || '0.0'} kg
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => onUpdate({ ...data, weight: '0.0' })}
            >
              Tare
            </Button>
          </div>
        );

      case 'thermometer':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Current</span>
              <span className="font-semibold">{data.currentTemp || 22}°C</span>
            </div>
            <Progress value={((data.currentTemp || 22) / 100) * 100} className="h-2" />
          </div>
        );

      default:
        return (
          <div className="text-center text-xs text-muted-foreground">
            Device ready
          </div>
        );
    }
  };

  const AddDeviceForm = () => {
    const [deviceName, setDeviceName] = useState('');
    const [deviceType, setDeviceType] = useState('oven');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!deviceName.trim()) return;

      addDevice({
        name: deviceName,
        type: deviceType,
        settings: {}
      });
      
      setDeviceName('');
      setDeviceType('oven');
    };

    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="My Smart Oven"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="deviceType">Device Type</Label>
              <select
                id="deviceType"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="oven">Oven</option>
                <option value="stove">Stove</option>
                <option value="refrigerator">Refrigerator</option>
                <option value="scale">Scale</option>
                <option value="thermometer">Thermometer</option>
                <option value="timer">Timer</option>
                <option value="air_fryer">Air Fryer</option>
                <option value="pressure_cooker">Pressure Cooker</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddingDevice(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Smart Kitchen
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Control and monitor your connected kitchen devices
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="text-xl font-semibold">
                {devices.filter(d => d.is_connected).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-xl font-semibold">
                {devices.filter(d => !d.is_connected).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-semibold">{devices.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Battery className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-semibold">
                {devices.filter(d => d.is_connected && d.device_data?.isRunning).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
          
          {isAddingDevice ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <AddDeviceForm />
            </motion.div>
          ) : (
            <motion.div
              key="add-button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card 
                className="border-dashed border-2 border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setIsAddingDevice(true)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-48 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">Add Smart Device</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect a new kitchen appliance
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SmartKitchenDashboard;