
REVOKE EXECUTE ON FUNCTION public._app_credential_key() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_credential(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_credential(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_cron_secret() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_allowed_email_on_signup() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_invite_approval() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_space_for_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_admin_to_specific_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._encrypt_gcal_tokens() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._encrypt_user_integration_secrets() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._encrypt_alpaca_secrets() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public._encrypt_ibkr_secrets() FROM authenticated;
