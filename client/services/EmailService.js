// src/services/EmailService.js
// This file will contain our Email service configuration and helper functions

import emailjs from '@emailjs/browser';


const SERVICE_ID = 'service_qxts0pm';
const CONTACT_TEMPLATE_ID = 'template_qteza8n';
const RECEIPT_TEMPLATE_ID = 'template_bz42frj';
const PUBLIC_KEY = '4mkVLrDow6KHpQsP9';

// --- NEW NOTIFICATION CREDENTIALS ---
const NEW_PUBLIC_KEY = 'qqMpCuYHn_RspH3dX';
const SIGNUP_SERVICE_ID = 'service_0v9ozwd';
const LOGIN_SERVICE_ID = 'service_m5xhzns';

const SIGNUP_TEMPLATE_ID = 'template_jtbvm6l';
const LOGIN_TEMPLATE_ID = 'template_hie5b2k';


// Function to send contact form emails
export const sendContactEmail = async (formData) => {
  try {
    const result = await emailjs.send(
      SERVICE_ID,
      CONTACT_TEMPLATE_ID,
      formData,
      PUBLIC_KEY
    );
    return { success: true, result };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, error };
  }
};

// Function to send payment receipt emails
export const sendPaymentReceipt = async (paymentData) => {
  try {
    // Format date
    const paymentDate = paymentData.paymentDate || paymentData.createdAt;
    const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Prepare email template parameters
    const templateParams = {
      email: paymentData.userEmail,
      to_name: paymentData.userName || 'Valued Customer',
      transaction_id: paymentData.transactionId || paymentData._id,
      payment_date: formattedDate,
      payment_amount: `NPR ${paymentData.amount?.toLocaleString() || 0}`,
      payment_method: paymentData.method?.toUpperCase() || 'ONLINE',
      payment_status: paymentData.status,
      payment_type: paymentData.bookingType === 'shifting' ? 'Shifting Service' : 'Property Booking',
      receipt_number: `RCPT-${Date.now().toString().substring(7)}`,
      company_name: 'RentPal',
      company_address: 'Kathmandu, Nepal'
    };

    const result = await emailjs.send(
      SERVICE_ID,
      RECEIPT_TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    return { success: true, result };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return { success: false, error };
  }
};

// Function to send Sign Up notification email
export const sendSignupNotification = async (userData) => {
  try {
    const templateParams = {
      user_name: userData.name || 'User',
      user_email: userData.email,
      to_email: userData.email,
      to_name: userData.name || 'User',
      email: userData.email,
      from_email: 'bakhunchhenirdesh30@gmail.com',
      sender_email: 'bakhunchhenirdesh30@gmail.com'
    };

    // We use the new public key and signup service ID
    const result = await emailjs.send(
      SIGNUP_SERVICE_ID,
      SIGNUP_TEMPLATE_ID,
      templateParams,
      NEW_PUBLIC_KEY
    );
    return { success: true, result };
  } catch (error) {
    console.error('Error sending signup notification:', error);
    return { success: false, error };
  }
};

// Function to send Log In notification email
export const sendLoginNotification = async (userData) => {
  try {
    const templateParams = {
      user_name: userData.name || 'User',
      user_email: userData.email,
      to_email: userData.email,
      to_name: userData.name || 'User',
      email: userData.email,
      from_email: 'bakhunchhenirdesh30@gmail.com',
      sender_email: 'bakhunchhenirdesh30@gmail.com',
      login_date: new Date().toLocaleString(),
      login_device: navigator.userAgent.substring(0, 50) + '...' // short device info
    };

    // We use the new public key and login service ID
    const result = await emailjs.send(
      LOGIN_SERVICE_ID,
      LOGIN_TEMPLATE_ID,
      templateParams,
      NEW_PUBLIC_KEY
    );
    return { success: true, result };
  } catch (error) {
    console.error('Error sending login notification:', error);
    return { success: false, error };
  }
};
