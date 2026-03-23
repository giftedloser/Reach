import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound } from "lucide-react";
import { StoredCredential } from "@/types";

interface CredentialPickerProps {
  value: string | null;
  onChange: (credentialId: string | null) => void;
}

export function CredentialPicker({ value, onChange }: CredentialPickerProps) {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);

  useEffect(() => {
    invoke<StoredCredential[]>("list_stored_credentials")
      .then(setCredentials)
      .catch(console.error);
  }, []);

  if (credentials.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-center gap-1.5">
        <KeyRound className="h-3.5 w-3.5" />
        Credential
      </Label>
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onChange(v === "__none__" ? null : v)}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Prompt for credentials" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Prompt for credentials</span>
          </SelectItem>
          {credentials.map((cred) => (
            <SelectItem key={cred.id} value={cred.id}>
              <div className="flex items-center gap-2">
                <span>{cred.label}</span>
                <span className="text-xs text-muted-foreground">({cred.username})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
