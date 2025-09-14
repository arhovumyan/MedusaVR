import React from 'react';
import { AlertCircle, Shield, Clock, Ban } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface BanModalProps {
  isOpen: boolean;
  banType: 'temporary' | 'permanent';
  message: string;
  violationCount?: number;
  violationType?: string;
  action?: string;
  onClose?: () => void;
}

export function BanModal({
  isOpen,
  banType,
  message,
  violationCount,
  violationType,
  action,
  onClose
}: BanModalProps) {
  const isPermanent = banType === 'permanent';
  
  const getIcon = () => {
    if (isPermanent) return <Ban className="h-12 w-12 text-red-500" />;
    return <Clock className="h-12 w-12 text-orange-500" />;
  };

  const getTitle = () => {
    if (isPermanent) return 'Account Permanently Banned';
    return 'Account Temporarily Banned';
  };

  const getAlertVariant = (): "default" | "destructive" => {
    return isPermanent ? 'destructive' : 'default';
  };

  const getBanTypeDescription = () => {
    if (isPermanent) {
      return 'Your account has been permanently disabled and cannot be restored.';
    }
    return 'Your account has been temporarily suspended.';
  };

  const getViolationDetails = () => {
    const violations = {
      age_violation: 'Content involving minors',
      repeated_violations: 'Multiple policy violations',
      system_manipulation: 'Attempting to bypass safety systems',
      terms_violation: 'Terms of Service violation'
    };

    return violations[violationType as keyof typeof violations] || 'Policy violation';
  };

  const handleContactSupport = () => {
    // Open email client or support form
    window.location.href = 'mailto:support@medusa-vrfriendly.vercel.app?subject=Account Ban Appeal&body=Please describe your appeal here.';
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Redirect to homepage or login page
      window.location.href = '/';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {getIcon()}
          </div>
          <DialogTitle className={`text-xl font-bold ${isPermanent ? 'text-red-600' : 'text-orange-600'}`}>
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {getBanTypeDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant={getAlertVariant()}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Policy Violation Detected</AlertTitle>
            <AlertDescription className="mt-2">
              {message}
            </AlertDescription>
          </Alert>

          {violationType && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Violation Details</h4>
              <p className="text-sm text-gray-600">
                <strong>Reason:</strong> {getViolationDetails()}
              </p>
              {violationCount && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Total Violations:</strong> {violationCount}
                </p>
              )}
              {action && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Action Taken:</strong> {action.replace('_', ' ').toUpperCase()}
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-800">Our Commitment to Safety</h4>
                <p className="text-sm text-blue-700 mt-1">
                  We maintain strict policies to ensure all users and characters are 18+ years old. 
                  Any attempts to create content involving minors result in immediate account suspension.
                </p>
              </div>
            </div>
          </div>

          {isPermanent && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">Permanent Ban Notice</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your account cannot be reactivated</li>
                <li>• No refunds will be provided for violations</li>
                <li>• Creating new accounts is prohibited</li>
                <li>• All user data will be retained for compliance purposes</li>
              </ul>
            </div>
          )}

          {!isPermanent && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Temporary Suspension</h4>
              <p className="text-sm text-orange-700">
                Your account will be automatically reactivated after the suspension period. 
                Please review our Terms of Service to avoid future violations.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col space-y-2">
          {!isPermanent && (
            <Button
              onClick={handleContactSupport}
              variant="outline"
              className="w-full"
            >
              Contact Support
            </Button>
          )}
          
          <Button
            onClick={handleClose}
            className={`w-full ${isPermanent ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
          >
            {isPermanent ? 'Understood' : 'I Understand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BanModal;
