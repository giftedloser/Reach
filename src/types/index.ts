export interface Connection {
  id: string;
  name: string;
  protocol: string;
  host: string;
  username: string | null;
  tags_json: string;
  favorite: boolean;
  gateway_json: string | null;
  rdp_options_json: string | null;
  icon: string | null;
  color: string | null;
  last_used_at: string | null;
  credential_id: string | null;
}

export interface CreateConnectionPayload {
  name: string;
  host: string;
  username: string | null;
  tags_json: string;
  gateway_json: string | null;
  rdp_options_json: string | null;
  icon: string | null;
  color: string | null;
  credential_id: string | null;
}

export interface UpdateConnectionPayload {
    id: string;
    name: string;
    host: string;
    username: string | null;
    tags_json: string;
    gateway_json: string | null;
    rdp_options_json: string | null;
    icon: string | null;
    color: string | null;
    credential_id: string | null;
}

export interface App {
  id: string;
  name: string;
  exe_path: string;
  working_dir: string | null;
  args: string | null;
  run_as_admin: boolean;
  tags_json: string;
  favorite: boolean;
  icon: string | null;
  color: string | null;
  last_used_at: string | null;
  credential_id: string | null;
}

export interface CreateAppPayload {
  name: string;
  exe_path: string;
  working_dir: string | null;
  args: string | null;
  run_as_admin: boolean;
  tags_json: string;
  icon: string | null;
  color: string | null;
  credential_id: string | null;
}

export interface UpdateAppPayload {
    id: string;
    name: string;
    exe_path: string;
    working_dir: string | null;
    args: string | null;
    run_as_admin: boolean;
    tags_json: string;
    icon: string | null;
    color: string | null;
    credential_id: string | null;
}

export interface SshConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string | null;
  tags_json: string;
  favorite: boolean;
  icon: string | null;
  color: string | null;
  last_used_at: string | null;
  credential_id: string | null;
}

export interface CreateSshPayload {
  name: string;
  host: string;
  port: number;
  username: string | null;
  tags_json: string;
  icon: string | null;
  color: string | null;
  credential_id: string | null;
}

export interface UpdateSshPayload {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string | null;
    tags_json: string;
    icon: string | null;
    color: string | null;
    credential_id: string | null;
}

export interface Tab {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
}

export interface TabAssignment {
    tab_id: string;
    resource_id: string;
    resource_type: string;
}

export interface StoredCredential {
    id: string;
    label: string;
    username: string;
    created_at: string | null;
}

export interface DesignatedGatewaySetting {
  hostname: string;
}

export interface ConnectionGatewayConfig {
  hostname?: string;
  mode?: "designated";
  use_designated_gateway?: boolean;
}

function normalizedGatewayHostname(value: string): string | null {
  const hostname = value.trim();
  const isPlausible = hostname.length > 0
    && !/\s/.test(hostname)
    && /^[A-Za-z0-9._:-]+$/.test(hostname);

  return isPlausible ? hostname : null;
}

export function connectionUsesGateway(connection: Pick<Connection, "gateway_json">): boolean {
  const gatewayJson = connection.gateway_json?.trim();
  if (!gatewayJson) {
    return false;
  }

  try {
    const parsed = JSON.parse(gatewayJson) as ConnectionGatewayConfig | string;
    if (typeof parsed === "string") {
      return normalizedGatewayHostname(parsed) !== null;
    }

    if (parsed.mode === "designated" || parsed.use_designated_gateway === true) {
      return true;
    }

    return parsed.hostname !== undefined && normalizedGatewayHostname(parsed.hostname) !== null;
  } catch {
    return normalizedGatewayHostname(gatewayJson) !== null;
  }
}
