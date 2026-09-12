"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDropToken = generateDropToken;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a cryptographically strong, URL-safe random token.
 * Uses 16 random bytes encoded as base64url or hex.
 */
function generateDropToken() {
    // 16 bytes = 128 bits of entropy
    return crypto_1.default.randomBytes(12).toString('hex');
}
