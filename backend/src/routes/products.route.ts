import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listProductsController } from "../controllers/products/listProducts";
import { getProductController } from "../controllers/products/getProduct";
import { createProductController } from "../controllers/products/createProduct";
import { updateProductController } from "../controllers/products/updateProduct";
import { deleteProductController } from "../controllers/products/deleteProduct";
import { bulkDeleteProductsController } from "../controllers/products/bulkDeleteProducts";

const productsRoutes = new Hono();

productsRoutes.use("*", authenticate);

productsRoutes.get(
  "/",
  apiValidator("query", validator.productQuery),
  listProductsController,
);
productsRoutes.get("/:id", getProductController);
productsRoutes.post(
  "/",
  authorize(["products:create"]),
  apiValidator("json", validator.createProduct),
  createProductController,
);
productsRoutes.put(
  "/:id",
  authorize(["products:update"]),
  apiValidator("json", validator.updateProduct),
  updateProductController,
);
productsRoutes.delete(
  "/bulk",
  authorize(["products:delete"]),
  bulkDeleteProductsController,
);
productsRoutes.delete(
  "/:id",
  authorize(["products:delete"]),
  deleteProductController,
);

export default productsRoutes;
