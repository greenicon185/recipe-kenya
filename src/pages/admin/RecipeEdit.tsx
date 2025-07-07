
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import RecipeForm from "@/components/RecipeForm";
import { getRecipeById, updateRecipe } from "@/services/recipeService";

const RecipeEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      const recipe = getRecipeById(id);
      if (recipe) {
        setInitialData(recipe);
      } else {
        // Recipe not found, redirect to admin dashboard
        navigate('/admin');
      }
      setLoading(false);
    }
  }, [id, navigate]);
  
  const handleUpdate = (data: any) => {
    if (id) {
      updateRecipe(id, data);
      navigate('/admin');
    }
  };
  
  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-recipe-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!initialData) {
    return (
      <AdminLayout title="Recipe Not Found">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">The recipe you are trying to edit does not exist.</p>
          <button 
            onClick={() => navigate('/admin')}
            className="text-recipe-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title={`Edit Recipe: ${initialData.title}`}>
      <RecipeForm 
        initialData={initialData}
        onSubmit={handleUpdate}
        buttonText="Update Recipe"
      />
    </AdminLayout>
  );
};

export default RecipeEdit;
