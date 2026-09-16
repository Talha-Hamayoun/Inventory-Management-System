import { Hono } from "hono";
import { apiValidator } from "../middlewares/apiValidator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { validator } from "../validators";
import { listCustomersController } from "../controllers/customers/listCustomers";
import { getCustomerController } from "../controllers/customers/getCustomer";
import { createCustomerController } from "../controllers/customers/createCustomer";
import { updateCustomerController } from "../controllers/customers/updateCustomer";
import { deleteCustomerController } from "../controllers/customers/deleteCustomer";

const customersRoutes = new Hono();

customersRoutes.use("*", authenticate);

customersRoutes.get("/", apiValidator("query", validator.customerQuery), listCustomersController);
customersRoutes.get("/:id", getCustomerController);
customersRoutes.post("/", authorize(["customers:create"]), apiValidator("json", validator.createCustomer), createCustomerController);
customersRoutes.put("/:id", authorize(["customers:update"]), apiValidator("json", validator.updateCustomer), updateCustomerController);
customersRoutes.delete("/:id", authorize(["customers:delete"]), deleteCustomerController);

export default customersRoutes;


// http:localhost:3000/api/customers