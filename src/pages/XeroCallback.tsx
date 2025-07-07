
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const XeroCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    console.log('🔄 [XERO-CALLBACK] OAuth callback page loaded');
    console.log('🔄 [XERO-CALLBACK] Current URL:', window.location.href);
    
    // Extract the authorization code and state from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('🔍 [XERO-CALLBACK] URL parameters:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription,
      fullUrl: window.location.href,
      search: window.location.search
    });

    // Check if we're in a popup window
    const isPopup = window.opener && window.opener !== window;
    console.log('🪟 [XERO-CALLBACK] Window context:', { 
      isPopup,
      hasOpener: !!window.opener,
      openerOrigin: window.opener ? 'available' : 'not available'
    });

    if (error) {
      console.error('❌ [XERO-CALLBACK] OAuth error received:', { error, errorDescription });
      setStatus('error');
      setMessage(`Error: ${error} - ${errorDescription || 'Unknown error'}`);
      
      if (isPopup && window.opener) {
        console.log('📨 [XERO-CALLBACK] Sending error message to parent window');
        try {
          window.opener.postMessage({
            type: 'XERO_AUTH_ERROR',
            error: error,
            errorDescription: errorDescription
          }, '*'); // Use '*' to avoid origin issues
          
          console.log('✅ [XERO-CALLBACK] Error message sent successfully');
        } catch (err) {
          console.error('❌ [XERO-CALLBACK] Failed to send error message:', err);
        }
        
        // Close popup after a short delay
        setTimeout(() => {
          console.log('🔄 [XERO-CALLBACK] Closing popup window');
          window.close();
        }, 3000);
      }
      return;
    }

    if (code) {
      console.log('✅ [XERO-CALLBACK] Authorization code received:', code.substring(0, 20) + '...');
      setStatus('success');
      setMessage('Authorization successful! Closing window...');
      
      if (isPopup && window.opener) {
        console.log('📨 [XERO-CALLBACK] Sending success message to parent window');
        try {
          const messageData = {
            type: 'XERO_AUTH_SUCCESS',
            code: code,
            state: state
          };
          
          console.log('📨 [XERO-CALLBACK] Message data:', { type: messageData.type, hasCode: !!messageData.code });
          
          window.opener.postMessage(messageData, '*'); // Use '*' to avoid origin issues
          
          console.log('✅ [XERO-CALLBACK] Success message sent successfully');
        } catch (err) {
          console.error('❌ [XERO-CALLBACK] Failed to send success message:', err);
        }
        
        console.log('📨 [XERO-CALLBACK] Message sent to parent window, closing popup in 2 seconds');
        
        // Close popup after a short delay to ensure message is received
        setTimeout(() => {
          console.log('🔄 [XERO-CALLBACK] Closing popup window');
          window.close();
        }, 2000);
      } else {
        console.warn('⚠️ [XERO-CALLBACK] Not in popup window or no opener available');
        setMessage('Not in popup window - please close this window manually');
      }
    } else {
      console.error('❌ [XERO-CALLBACK] No authorization code found in URL');
      setStatus('error');
      setMessage('No authorization code received from Xero');
      
      if (isPopup && window.opener) {
        console.log('📨 [XERO-CALLBACK] Sending no-code error message to parent window');
        try {
          window.opener.postMessage({
            type: 'XERO_AUTH_ERROR',
            error: 'no_code',
            errorDescription: 'No authorization code received from Xero'
          }, '*');
          
          console.log('✅ [XERO-CALLBACK] No-code error message sent successfully');
        } catch (err) {
          console.error('❌ [XERO-CALLBACK] Failed to send no-code error message:', err);
        }
        
        setTimeout(() => {
          console.log('🔄 [XERO-CALLBACK] Closing popup window');
          window.close();
        }, 3000);
      }
    }
  }, []);

  // Show appropriate status while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
            {status === 'processing' && 'Processing Xero Authorization'}
            {status === 'success' && 'Authorization Successful'}
            {status === 'error' && 'Authorization Failed'}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            {status === 'processing' && 'This window will close automatically once the process is complete.'}
            {status === 'success' && 'You can close this window or it will close automatically.'}
            {status === 'error' && 'Please close this window and try again.'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XeroCallback;
