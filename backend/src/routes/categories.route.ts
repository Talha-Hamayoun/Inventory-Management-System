import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listCategoriesController } from "../controllers/categories/listCategories";
import { getCategoryTreeController } from "../controllers/categories/getCategoryTree";
import { getCategoryController } from "../controllers/categories/getCategory";
import { createCategoryController } from "../controllers/categories/createCategory";
import { updateCategoryController } from "../controllers/categories/updateCategory";
import { deleteCategoryController } from "../controllers/categories/deleteCategory";
import { bulkDeleteCategoriesController } from "../controllers/categories/bulkDeleteCategories";

const categoriesRoutes = new Hono();

categoriesRoutes.use("*", authenticate);

categoriesRoutes.get(
  "/",
  apiValidator("query", validator.pagination),
  listCategoriesController,
);

categoriesRoutes.get("/tree", getCategoryTreeController);

categoriesRoutes.get("/:id", getCategoryController);

categoriesRoutes.post(
  "/",
  authorize(["categories:create"]),
  apiValidator("json", validator.createCategory),
  createCategoryController,
);

categoriesRoutes.put(
  "/:id",
  authorize(["categories:update"]),
  apiValidator("json", validator.updateCategory),
  updateCategoryController,
);

categoriesRoutes.delete(
  "/bulk",
  authorize(["categories:delete"]),
  bulkDeleteCategoriesController,
);
categoriesRoutes.delete(
  "/:id",
  authorize(["categories:delete"]),
  deleteCategoryController,
);

export default categoriesRoutes;
