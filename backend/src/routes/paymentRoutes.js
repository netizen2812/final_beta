import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { createOrder, verifyPayment } from "../controller/paymentController.js";

const router = express.Router();

router.post("/create-order", ClerkExpressRequireAuth(), createOrder);
router.post("/verify", ClerkExpressRequireAuth(), verifyPayment);

export default router;
