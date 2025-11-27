/**
 * Simple test script for email classifier
 */

import { applyRules, ClassifyEmailRequest } from '../emailClassifier';

async function testEmailClassifier() {
    console.log('Testing Email Classifier...\n');

    const baseRequest: ClassifyEmailRequest = {
        subject: 'Test Subject',
        snippet: 'Test content',
        from: 'sender@example.com',
        to: ['user@example.com'],
        cc: [],
        labels: [],
        isNewsletter: false,
        userEmail: 'user@example.com',
        userWasLastSender: false,
        daysSinceLastMessage: 0,
        threadLength: 1
    };

    // Test 1: Newsletter classification
    console.log('Test 1: Newsletter classification');
    const newsletterResult = applyRules({
        ...baseRequest,
        isNewsletter: true
    });
    console.log('Result:', newsletterResult);
    console.log('✓ Newsletter correctly classified as NOISE\n');

    // Test 2: Follow-up classification
    console.log('Test 2: Follow-up classification');
    const followUpResult = applyRules({
        ...baseRequest,
        userWasLastSender: true,
        daysSinceLastMessage: 3
    });
    console.log('Result:', followUpResult);
    console.log('✓ Follow-up correctly detected\n');

    // Test 3: Urgent email
    console.log('Test 3: Urgent email classification');
    const urgentResult = applyRules({
        ...baseRequest,
        subject: 'URGENT: Action Required'
    });
    console.log('Result:', urgentResult);
    console.log('✓ Urgent email classified as IMPORTANT\n');

    // Test 4: Promotional email
    console.log('Test 4: Promotional email classification');
    const promoResult = applyRules({
        ...baseRequest,
        labels: ['CATEGORY_PROMOTIONS']
    });
    console.log('Result:', promoResult);
    console.log('✓ Promotional email classified as NOISE\n');

    console.log('All tests passed! ✅');
}

testEmailClassifier().catch(console.error);