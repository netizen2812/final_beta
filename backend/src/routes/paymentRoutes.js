import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { createOrder, verifyPayment } from "../controller/paymentController.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

export default router;
