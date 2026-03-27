import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Leaf, Upload, Camera, History, Settings, Recycle, TrendingUp,
  Shirt, Tag, DollarSign, AlertTriangle, CheckCircle, X, Loader2,
  Plus, Trash2, Edit2, Save, RefreshCw, BarChart3, Package, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============== RVS CIRCULAR GAUGE ==============
const RVSGauge = ({ score, size = 200 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  
  const getColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#14b8a6";
    if (score >= 20) return "#d97757";
    return "#ef4444";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e6ede7"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-heading font-bold text-text-primary">{score.toFixed(1)}</span>
        <span className="text-sm text-text-muted">RVS Score</span>
      </div>
    </div>
  );
};

// ============== IMAGE UPLOADER ==============
const ImageUploader = ({ onImageCapture, isLoading }) => {
  const [preview, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        setPreview(reader.result);
        onImageCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      toast.error("Could not access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1];
      setPreview(dataUrl);
      onImageCapture(base64);
      stopCamera();
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {!preview && !showCamera && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shirt className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold text-text-primary">Upload Garment Image</p>
              <p className="text-sm text-text-muted mt-1">PNG, JPG up to 10MB</p>
            </div>
            <div className="flex gap-3">
              <Button
                data-testid="upload-file-button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                data-testid="camera-capture-button"
                onClick={startCamera}
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Use Camera
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="file-input"
            />
          </div>
        </div>
      )}

      {showCamera && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <Button
              data-testid="capture-photo-button"
              onClick={capturePhoto}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            <Button
              data-testid="cancel-camera-button"
              variant="destructive"
              onClick={stopCamera}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Garment preview"
            className="w-full max-h-80 object-contain rounded-lg border border-border"
            data-testid="image-preview"
          />
          <Button
            data-testid="clear-image-button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={clearImage}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ============== SCORE BREAKDOWN ==============
const ScoreBreakdown = ({ result }) => {
  const scores = [
    { label: "Fabric Quality (Q)", value: result.fabric_quality_score, weight: "30%", color: "#386641" },
    { label: "Wear & Tear (W)", value: result.wear_tear_score, weight: "25%", color: "#4b554e" },
    { label: "Cleanliness (C)", value: result.cleanliness_score, weight: "15%", color: "#14b8a6" },
    { label: "Age Score (A)", value: result.age_score, weight: "15%", color: "#8b968e" },
    { label: "Brand Value (B)", value: result.brand_value_score, weight: "10%", color: "#a7c957" },
    { label: "Market Demand (M)", value: result.market_demand_score, weight: "5%", color: "#f59e0b" },
  ];

  return (
    <div className="space-y-3">
      {scores.map((score, idx) => (
        <div key={idx} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">{score.label}</span>
            <span className="font-medium text-text-primary">{score.value} <span className="text-text-muted text-xs">({score.weight})</span></span>
          </div>
          <Progress value={score.value} className="h-2" />
        </div>
      ))}
    </div>
  );
};

// ============== ANALYSIS RESULTS ==============
const AnalysisResults = ({ result }) => {
  if (!result) return null;

  const getActionBadgeClass = (action) => {
    const classes = {
      "Full Resale": "bg-status-resale text-white",
      "Refurbish & Resale": "bg-status-refurbish text-white",
      "Recycle Fabric": "bg-status-recycle text-white",
      "Downcycle": "bg-status-downcycle text-white",
      "Waste": "bg-status-waste text-white",
    };
    return classes[action] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
        <RVSGauge score={result.rvs_total} />
        
        <div className="text-center md:text-left space-y-3">
          <Badge className={`${getActionBadgeClass(result.suggested_action)} text-lg px-4 py-2`} data-testid="suggested-action-badge">
            {result.suggested_action}
          </Badge>
          
          {result.retail_price > 0 && (
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-text-secondary">Eligible Return Credit</p>
              <p className="text-3xl font-heading font-bold text-primary" data-testid="return-credit">
                ${result.return_credit.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Score Breakdown</CardTitle>
          <CardDescription>RVS = (Q×0.30) + (W×0.25) + (C×0.15) + (A×0.15) + (B×0.10) + (M×0.05)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreBreakdown result={result} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">AI Analysis Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">Fabric Type</p>
              <p className="font-medium" data-testid="fabric-type">{result.ai_analysis?.fabric_type || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Overall Condition</p>
              <p className="font-medium" data-testid="overall-condition">{result.ai_analysis?.overall_condition || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Brand Detected</p>
              <p className="font-medium" data-testid="brand-detected">{result.ai_analysis?.brand_detected || "Not identified"}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Confidence</p>
              <p className="font-medium">{((result.ai_analysis?.confidence || 0) * 100).toFixed(0)}%</p>
            </div>
          </div>

          {result.ai_analysis?.damage_detected?.length > 0 && (
            <div>
              <p className="text-sm text-text-muted mb-2">Damage Detected</p>
              <div className="flex flex-wrap gap-2">
                {result.ai_analysis.damage_detected.map((damage, idx) => (
                  <Badge key={idx} variant="outline" className="border-status-waste text-status-waste">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {damage}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.ai_analysis?.stain_detected && (
            <div className="flex items-center gap-2 text-status-refurbish">
              <AlertTriangle className="w-4 h-4" />
              <span>Stains detected ({result.ai_analysis.stain_area_percentage}% area)</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============== HOME PAGE ==============
const HomePage = () => {
  const [imageBase64, setImageBase64] = useState(null);
  const [retailPrice, setRetailPrice] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/admin/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories");
    }
  };

  const analyzeGarment = async () => {
    if (!imageBase64) {
      toast.error("Please upload a garment image first");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/analyze`, {
        image_base64: imageBase64,
        retail_price: parseFloat(retailPrice) || 0,
        brand_name: brandName || null,
        category: category || null,
        age_months: parseInt(ageMonths) || 0,
      });
      setResult(res.data);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setImageBase64(null);
    setRetailPrice("");
    setBrandName("");
    setCategory("");
    setAgeMonths("");
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="home-page">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold text-text-primary">Garment Reusability Analysis</h1>
        <p className="text-text-secondary">Upload a garment image to get its Reusability Value Score</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Shirt className="w-5 h-5 text-primary" />
              Garment Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader onImageCapture={setImageBase64} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Garment Details
            </CardTitle>
            <CardDescription>Optional details for better scoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="retail-price">Retail Price ($)</Label>
              <Input
                id="retail-price"
                data-testid="retail-price-input"
                type="number"
                placeholder="e.g., 49.99"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                data-testid="brand-name-input"
                placeholder="e.g., Patagonia, Zara"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="age">Age (months)</Label>
              <Input
                id="age"
                data-testid="age-input"
                type="number"
                placeholder="e.g., 6"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                data-testid="analyze-button"
                className="flex-1"
                onClick={analyzeGarment}
                disabled={isLoading || !imageBase64}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Recycle className="w-4 h-4 mr-2" />
                    Analyze Garment
                  </>
                )}
              </Button>
              <Button
                data-testid="reset-button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && <AnalysisResults result={result} />}
    </div>
  );
};

// ============== HISTORY PAGE ==============
const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/history`);
      setHistory(res.data);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAnalysis = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`);
      setHistory(history.filter(h => h.id !== id));
      toast.success("Analysis deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const getActionColor = (action) => {
    const colors = {
      "Full Resale": "bg-status-resale",
      "Refurbish & Resale": "bg-status-refurbish",
      "Recycle Fabric": "bg-status-recycle",
      "Downcycle": "bg-status-downcycle",
      "Waste": "bg-status-waste",
    };
    return colors[action] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="history-page">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold text-text-primary">Analysis History</h1>
        <Badge variant="outline">{history.length} records</Badge>
      </div>

      {history.length === 0 ? (
        <Card className="p-12 text-center">
          <History className="w-12 h-12 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary">No analysis history yet</p>
          <p className="text-sm text-text-muted">Analyze a garment to see it here</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <Card key={item.id} className="shadow-card hover:shadow-hover transition-shadow" data-testid={`history-item-${item.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                      <RVSGauge score={item.rvs_total} size={60} />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {item.ai_analysis?.fabric_type || "Unknown"} - {item.ai_analysis?.overall_condition || "N/A"}
                      </p>
                      <p className="text-sm text-text-muted">
                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={`${getActionColor(item.suggested_action)} text-white`}>
                      {item.suggested_action}
                    </Badge>
                    {item.retail_price > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-text-muted">Return Credit</p>
                        <p className="font-semibold text-primary">${item.return_credit.toFixed(2)}</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnalysis(item.id)}
                      data-testid={`delete-history-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============== ADMIN DASHBOARD ==============
const AdminDashboard = () => {
  const [settings, setSettings] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWeights, setEditingWeights] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: "", category: "medium_quality", score: 50, keywords: [] });
  const [newCategory, setNewCategory] = useState({ name: "", market_demand_score: 50 });
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, brandsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/admin/settings`),
        axios.get(`${API}/admin/brands`),
        axios.get(`${API}/admin/categories`),
      ]);
      setSettings(settingsRes.data);
      setEditingWeights(settingsRes.data.formula_weights);
      setBrands(brandsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const seedData = async () => {
    try {
      await axios.post(`${API}/admin/seed`);
      toast.success("Default data seeded!");
      fetchData();
    } catch (err) {
      toast.error("Failed to seed data");
    }
  };

  const saveWeights = async () => {
    try {
      await axios.put(`${API}/admin/settings`, {
        ...settings,
        formula_weights: editingWeights,
      });
      setSettings({ ...settings, formula_weights: editingWeights });
      toast.success("Weights updated!");
    } catch (err) {
      toast.error("Failed to save weights");
    }
  };

  const addBrand = async () => {
    try {
      const res = await axios.post(`${API}/admin/brands`, newBrand);
      setBrands([...brands, res.data]);
      setNewBrand({ name: "", category: "medium_quality", score: 50, keywords: [] });
      setShowBrandDialog(false);
      toast.success("Brand added!");
    } catch (err) {
      toast.error("Failed to add brand");
    }
  };

  const deleteBrand = async (id) => {
    try {
      await axios.delete(`${API}/admin/brands/${id}`);
      setBrands(brands.filter(b => b.id !== id));
      toast.success("Brand deleted");
    } catch (err) {
      toast.error("Failed to delete brand");
    }
  };

  const addCategory = async () => {
    try {
      const res = await axios.post(`${API}/admin/categories`, newCategory);
      setCategories([...categories, res.data]);
      setNewCategory({ name: "", market_demand_score: 50 });
      setShowCategoryDialog(false);
      toast.success("Category added!");
    } catch (err) {
      toast.error("Failed to add category");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`${API}/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getBrandCategoryBadge = (cat) => {
    const styles = {
      eco_friendly: "bg-status-resale text-white",
      medium_quality: "bg-status-refurbish text-white",
      mass_produced: "bg-status-downcycle text-white",
    };
    return styles[cat] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Super Admin Dashboard</h1>
          <p className="text-text-secondary">Manage scoring formulas, brands, and categories</p>
        </div>
        <Button onClick={seedData} variant="outline" data-testid="seed-data-button">
          <RefreshCw className="w-4 h-4 mr-2" />
          Seed Default Data
        </Button>
      </div>

      <Tabs defaultValue="formula" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="formula" data-testid="formula-tab">
            <BarChart3 className="w-4 h-4 mr-2" />
            Formula Weights
          </TabsTrigger>
          <TabsTrigger value="brands" data-testid="brands-tab">
            <Award className="w-4 h-4 mr-2" />
            Brands
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="categories-tab">
            <Package className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formula" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">RVS Formula Weights</CardTitle>
              <CardDescription>
                RVS = (Q×{editingWeights?.Q}) + (W×{editingWeights?.W}) + (C×{editingWeights?.C}) + (A×{editingWeights?.A}) + (B×{editingWeights?.B}) + (M×{editingWeights?.M})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {editingWeights && Object.entries(editingWeights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{key === "Q" ? "Fabric Quality (Q)" : key === "W" ? "Wear & Tear (W)" : key === "C" ? "Cleanliness (C)" : key === "A" ? "Age Score (A)" : key === "B" ? "Brand Value (B)" : "Market Demand (M)"}</Label>
                    <span className="font-mono text-sm">{(value * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    data-testid={`weight-slider-${key}`}
                    value={[value * 100]}
                    onValueChange={([v]) => setEditingWeights({ ...editingWeights, [key]: v / 100 })}
                    max={100}
                    step={5}
                  />
                </div>
              ))}
              <Button onClick={saveWeights} className="w-full" data-testid="save-weights-button">
                <Save className="w-4 h-4 mr-2" />
                Save Weights
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading">Brand Management</CardTitle>
                <CardDescription>Manage brand categories and their scores</CardDescription>
              </div>
              <Dialog open={showBrandDialog} onOpenChange={setShowBrandDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="add-brand-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Brand
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Brand</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Brand Name</Label>
                      <Input
                        data-testid="new-brand-name"
                        value={newBrand.name}
                        onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                        placeholder="e.g., Nike"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={newBrand.category}
                        onValueChange={(v) => setNewBrand({ ...newBrand, category: v })}
                      >
                        <SelectTrigger data-testid="new-brand-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eco_friendly">Eco-Friendly / High Quality</SelectItem>
                          <SelectItem value="medium_quality">Medium Quality</SelectItem>
                          <SelectItem value="mass_produced">Mass Produced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Score (0-100)</Label>
                      <Input
                        data-testid="new-brand-score"
                        type="number"
                        value={newBrand.score}
                        onChange={(e) => setNewBrand({ ...newBrand, score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={addBrand} className="w-full" data-testid="save-new-brand">
                      Save Brand
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>
                          <Badge className={getBrandCategoryBadge(brand.category)}>
                            {brand.category.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{brand.score}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBrand(brand.id)}
                            data-testid={`delete-brand-${brand.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading">Category Management</CardTitle>
                <CardDescription>Manage product categories and market demand scores</CardDescription>
              </div>
              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="add-category-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Category Name</Label>
                      <Input
                        data-testid="new-category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., Jackets"
                      />
                    </div>
                    <div>
                      <Label>Market Demand Score (0-100)</Label>
                      <Input
                        data-testid="new-category-score"
                        type="number"
                        value={newCategory.market_demand_score}
                        onChange={(e) => setNewCategory({ ...newCategory, market_demand_score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={addCategory} className="w-full" data-testid="save-new-category">
                      Save Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Market Demand Score</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={cat.market_demand_score} className="w-24 h-2" />
                            <span className="text-sm">{cat.market_demand_score}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCategory(cat.id)}
                            data-testid={`delete-category-${cat.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============== NAVIGATION ==============
const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Analyze", icon: Recycle },
    { path: "/history", label: "History", icon: History },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img
              src="https://www.mud-patch.com/mudpatch/main_logo.png"
              alt="Mud Patch"
              className="h-8"
            />
            <span className="font-heading font-semibold text-text-primary hidden sm:block">
              Reusability AI
            </span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-secondary"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// ============== MAIN APP ==============
function App() {
  return (
    <div className="min-h-screen bg-background font-body">
      <BrowserRouter>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;
