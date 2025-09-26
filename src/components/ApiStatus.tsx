import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ApiRequirement {
  field: string;
  status: 'missing' | 'present' | 'warning';
  description: string;
  value?: any;
}

interface ApiStatusProps {
  data: any;
  apiEndpoint: string;
  requirements: ApiRequirement[];
}

export function ApiStatus({ data, apiEndpoint, requirements }: ApiStatusProps) {
  const missingFields = requirements.filter(req => req.status === 'missing');
  const warningFields = requirements.filter(req => req.status === 'warning');
  const presentFields = requirements.filter(req => req.status === 'present');
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'missing': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'present': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'missing': return 'destructive';
      case 'warning': return 'warning';
      case 'present': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={missingFields.length > 0 ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>API Status Check - {apiEndpoint}</AlertTitle>
        <AlertDescription>
          {missingFields.length === 0 
            ? "All required fields are present for API submission"
            : `${missingFields.length} required field(s) missing for successful API submission`
          }
        </AlertDescription>
      </Alert>

      <div className="grid gap-2">
        <h4 className="text-sm font-medium">Field Status:</h4>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(req.status)}
              <span className="text-sm font-medium">{req.field}</span>
              <Badge variant={getStatusColor(req.status) as any} className="text-xs">
                {req.status}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{req.description}</div>
              {req.value !== undefined && (
                <div className="text-xs text-foreground mt-1">
                  Value: {JSON.stringify(req.value)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {missingFields.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Missing Required Fields</AlertTitle>
          <AlertDescription>
            The following fields are required by the API but not provided:
            <ul className="mt-2 list-disc list-inside">
              {missingFields.map((field, index) => (
                <li key={index}>{field.field} - {field.description}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}