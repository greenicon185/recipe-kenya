
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import RecipeForm from "@/components/RecipeForm";
import { createRecipe } from "@/services/recipeService";
import { useToast } from "@/hooks/use-toast";

const RecipeCreate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleCreate = async (data: any) => {
    try {
      await createRecipe(data);
      toast({
        title: "Recipe created successfully",
        description: "The recipe has been added to the database.",
      });
      navigate('/admin');
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast({
        title: "Error creating recipe",
        description: "There was an error creating the recipe. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AdminLayout title="Create New Recipe">
      <RecipeForm 
        onSubmit={handleCreate}
        buttonText="Create Recipe"
      />
    </AdminLayout>
  );
};

export default RecipeCreate;
