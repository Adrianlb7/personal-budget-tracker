type RecoveryRequestError = {
  code?: string;
  status?: number;
};

export function recoveryRequestErrorMessage(
  error: RecoveryRequestError,
): string {
  switch (error.code) {
    case "email_address_not_authorized":
      return "Supabase's default mailer cannot email this address because it is not on the organization team. Configure custom SMTP for recovery emails.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Supabase's email limit was reached. Wait before trying again, or configure custom SMTP.";
    case "email_address_invalid":
      return "Supabase rejected this email address. Check it and try again.";
    case "server_connection_error":
      return "Orba could not connect to Supabase. Check your local server and Supabase project status.";
    default:
      return `The recovery email could not be sent (Supabase ${error.code ?? error.status ?? "connection error"}). Check Authentication logs in Supabase.`;
  }
}
