#include <stdio.h>
#include <emscripten/bind.h>
//#include <emscripten.h>

#include "qwertycoin_wasm_bridge.h"

// register bindings from JS to C++ using emscripten
EMSCRIPTEN_BINDINGS(module)
{
  // ------------------------------ UTILITIES ---------------------------------

  emscripten::function("set_log_level", &qwertycoin_wasm_bridge::set_log_level);
  emscripten::function("get_integrated_address_util", &qwertycoin_wasm_bridge::get_integrated_address_util);
  emscripten::function("validate_address", &qwertycoin_wasm_bridge::validate_address);
  emscripten::function("get_exception_message", &qwertycoin_wasm_bridge::get_exception_message);
  emscripten::function("malloc_binary_from_json", &qwertycoin_wasm_bridge::malloc_binary_from_json);
  emscripten::function("binary_to_json", &qwertycoin_wasm_bridge::binary_to_json);
  emscripten::function("binary_blocks_to_json", &qwertycoin_wasm_bridge::binary_blocks_to_json);

  // --------------------------- WALLET CREATION ------------------------------

  emscripten::function("open_wallet_full", &qwertycoin_wasm_bridge::open_wallet_full);
  emscripten::function("create_full_wallet", &qwertycoin_wasm_bridge::create_full_wallet);
  emscripten::function("get_full_wallet_seed_languages", &qwertycoin_wasm_bridge::get_full_wallet_seed_languages);

  emscripten::function("create_keys_wallet_random", &qwertycoin_wasm_bridge::create_keys_wallet_random);
  emscripten::function("create_keys_wallet_from_seed", &qwertycoin_wasm_bridge::create_keys_wallet_from_seed);
  emscripten::function("create_keys_wallet_from_keys", &qwertycoin_wasm_bridge::create_keys_wallet_from_keys);
  emscripten::function("get_keys_wallet_seed_languages", &qwertycoin_wasm_bridge::get_keys_wallet_seed_languages);

  // ----------------------- WALLET INSTANCE METHODS --------------------------

  emscripten::function("is_view_only", &qwertycoin_wasm_bridge::is_view_only);
  emscripten::function("set_daemon_connection", &qwertycoin_wasm_bridge::set_daemon_connection);
  emscripten::function("get_daemon_connection", &qwertycoin_wasm_bridge::get_daemon_connection);
  emscripten::function("is_daemon_trusted", &qwertycoin_wasm_bridge::is_daemon_trusted);
  emscripten::function("is_connected_to_daemon", &qwertycoin_wasm_bridge::is_connected_to_daemon);
  emscripten::function("get_daemon_max_peer_height", &qwertycoin_wasm_bridge::get_daemon_max_peer_height);
  emscripten::function("get_version", &qwertycoin_wasm_bridge::get_version);
  emscripten::function("get_seed", &qwertycoin_wasm_bridge::get_seed);
  emscripten::function("get_seed_language", &qwertycoin_wasm_bridge::get_seed_language);
  emscripten::function("get_private_spend_key", &qwertycoin_wasm_bridge::get_private_spend_key);
  emscripten::function("get_private_view_key", &qwertycoin_wasm_bridge::get_private_view_key);
  emscripten::function("get_public_view_key", &qwertycoin_wasm_bridge::get_public_view_key);
  emscripten::function("get_public_spend_key", &qwertycoin_wasm_bridge::get_public_spend_key);
  emscripten::function("get_address", &qwertycoin_wasm_bridge::get_address);
  emscripten::function("get_address_index", &qwertycoin_wasm_bridge::get_address_index);
  emscripten::function("get_integrated_address", &qwertycoin_wasm_bridge::get_integrated_address);
  emscripten::function("decode_integrated_address", &qwertycoin_wasm_bridge::decode_integrated_address);
  emscripten::function("get_height", &qwertycoin_wasm_bridge::get_height);
  emscripten::function("get_daemon_height", &qwertycoin_wasm_bridge::get_daemon_height);
  emscripten::function("get_height_by_date", &qwertycoin_wasm_bridge::get_height_by_date);
  emscripten::function("is_daemon_synced", &qwertycoin_wasm_bridge::is_daemon_synced);
  emscripten::function("is_synced", &qwertycoin_wasm_bridge::is_synced);
  emscripten::function("get_network_type", &qwertycoin_wasm_bridge::get_network_type);
  emscripten::function("get_restore_height", &qwertycoin_wasm_bridge::get_restore_height);
  emscripten::function("set_restore_height", &qwertycoin_wasm_bridge::set_restore_height);
  emscripten::function("set_listener", &qwertycoin_wasm_bridge::set_listener);
  emscripten::function("sync", &qwertycoin_wasm_bridge::sync);
  emscripten::function("stop_syncing", &qwertycoin_wasm_bridge::stop_syncing);
  emscripten::function("scan_txs", &qwertycoin_wasm_bridge::scan_txs);
  emscripten::function("rescan_spent", &qwertycoin_wasm_bridge::rescan_spent);
  emscripten::function("rescan_blockchain", &qwertycoin_wasm_bridge::rescan_blockchain);
  emscripten::function("get_balance_wallet", &qwertycoin_wasm_bridge::get_balance_wallet);
  emscripten::function("get_balance_account", &qwertycoin_wasm_bridge::get_balance_account);
  emscripten::function("get_balance_subaddress", &qwertycoin_wasm_bridge::get_balance_subaddress);
  emscripten::function("get_unlocked_balance_wallet", &qwertycoin_wasm_bridge::get_unlocked_balance_wallet);
  emscripten::function("get_unlocked_balance_account", &qwertycoin_wasm_bridge::get_unlocked_balance_account);
  emscripten::function("get_unlocked_balance_subaddress", &qwertycoin_wasm_bridge::get_unlocked_balance_subaddress);
  emscripten::function("get_accounts", &qwertycoin_wasm_bridge::get_accounts);
  emscripten::function("get_account", &qwertycoin_wasm_bridge::get_account);
  emscripten::function("create_account", &qwertycoin_wasm_bridge::create_account);
  emscripten::function("get_subaddresses", &qwertycoin_wasm_bridge::get_subaddresses);
  emscripten::function("create_subaddress", &qwertycoin_wasm_bridge::create_subaddress);
  emscripten::function("set_subaddress_label", &qwertycoin_wasm_bridge::set_subaddress_label);
  emscripten::function("get_txs", &qwertycoin_wasm_bridge::get_txs);
  emscripten::function("get_transfers", &qwertycoin_wasm_bridge::get_transfers);
  emscripten::function("get_outputs", &qwertycoin_wasm_bridge::get_outputs);
  emscripten::function("export_outputs", &qwertycoin_wasm_bridge::export_outputs);
  emscripten::function("import_outputs", &qwertycoin_wasm_bridge::import_outputs);
  emscripten::function("export_key_images", &qwertycoin_wasm_bridge::export_key_images);
  emscripten::function("import_key_images", &qwertycoin_wasm_bridge::import_key_images);
//  emscripten::function("get_new_key_images_from_last_import", &qwertycoin_wasm_bridge::get_new_key_images_from_last_import);
  emscripten::function("freeze_output", &qwertycoin_wasm_bridge::freeze_output);
  emscripten::function("thaw_output", &qwertycoin_wasm_bridge::thaw_output);
  emscripten::function("is_output_frozen", &qwertycoin_wasm_bridge::is_output_frozen);
  emscripten::function("get_default_fee_priority", &qwertycoin_wasm_bridge::get_default_fee_priority);
  emscripten::function("create_txs", &qwertycoin_wasm_bridge::create_txs);
  emscripten::function("sweep_output", &qwertycoin_wasm_bridge::sweep_output);
  emscripten::function("sweep_unlocked", &qwertycoin_wasm_bridge::sweep_unlocked);
  emscripten::function("sweep_dust", &qwertycoin_wasm_bridge::sweep_dust);
  emscripten::function("relay_txs", &qwertycoin_wasm_bridge::relay_txs);
  emscripten::function("describe_tx_set", &qwertycoin_wasm_bridge::describe_tx_set);
  emscripten::function("sign_txs", &qwertycoin_wasm_bridge::sign_txs);
  emscripten::function("submit_txs", &qwertycoin_wasm_bridge::submit_txs);
  emscripten::function("sign_message", &qwertycoin_wasm_bridge::sign_message);
  emscripten::function("verify_message", &qwertycoin_wasm_bridge::verify_message);
  emscripten::function("get_tx_key", &qwertycoin_wasm_bridge::get_tx_key);
  emscripten::function("check_tx_key", &qwertycoin_wasm_bridge::check_tx_key);
  emscripten::function("get_tx_proof", &qwertycoin_wasm_bridge::get_tx_proof);
  emscripten::function("check_tx_proof", &qwertycoin_wasm_bridge::check_tx_proof);
  emscripten::function("get_spend_proof", &qwertycoin_wasm_bridge::get_spend_proof);
  emscripten::function("check_spend_proof", &qwertycoin_wasm_bridge::check_spend_proof);
  emscripten::function("get_reserve_proof_wallet", &qwertycoin_wasm_bridge::get_reserve_proof_wallet);
  emscripten::function("get_reserve_proof_account", &qwertycoin_wasm_bridge::get_reserve_proof_account);
  emscripten::function("check_reserve_proof", &qwertycoin_wasm_bridge::check_reserve_proof);
  emscripten::function("get_tx_notes", &qwertycoin_wasm_bridge::get_tx_notes);
  emscripten::function("set_tx_notes", &qwertycoin_wasm_bridge::set_tx_notes);
  emscripten::function("get_address_book_entries", &qwertycoin_wasm_bridge::get_address_book_entries);
  emscripten::function("add_address_book_entry", &qwertycoin_wasm_bridge::add_address_book_entry);
  emscripten::function("edit_address_book_entry", &qwertycoin_wasm_bridge::edit_address_book_entry);
  emscripten::function("delete_address_book_entry", &qwertycoin_wasm_bridge::delete_address_book_entry);
  emscripten::function("tag_accounts", &qwertycoin_wasm_bridge::tag_accounts);
  emscripten::function("untag_accounts", &qwertycoin_wasm_bridge::untag_accounts);
  emscripten::function("get_account_tags", &qwertycoin_wasm_bridge::get_account_tags);
  emscripten::function("set_account_tag_label", &qwertycoin_wasm_bridge::set_account_tag_label);
  emscripten::function("get_payment_uri", &qwertycoin_wasm_bridge::get_payment_uri);
  emscripten::function("parse_payment_uri", &qwertycoin_wasm_bridge::parse_payment_uri);
  emscripten::function("get_attribute", &qwertycoin_wasm_bridge::get_attribute);
  emscripten::function("set_attribute", &qwertycoin_wasm_bridge::set_attribute);
  emscripten::function("is_multisig_import_needed", &qwertycoin_wasm_bridge::is_multisig_import_needed);
  emscripten::function("get_multisig_info", &qwertycoin_wasm_bridge::get_multisig_info);
  emscripten::function("prepare_multisig", &qwertycoin_wasm_bridge::prepare_multisig);
  emscripten::function("make_multisig", &qwertycoin_wasm_bridge::make_multisig);
  emscripten::function("exchange_multisig_keys", &qwertycoin_wasm_bridge::exchange_multisig_keys);
  emscripten::function("export_multisig_hex", &qwertycoin_wasm_bridge::export_multisig_hex);
  emscripten::function("import_multisig_hex", &qwertycoin_wasm_bridge::import_multisig_hex);
  emscripten::function("sign_multisig_tx_hex", &qwertycoin_wasm_bridge::sign_multisig_tx_hex);
  emscripten::function("submit_multisig_tx_hex", &qwertycoin_wasm_bridge::submit_multisig_tx_hex);
  emscripten::function("get_keys_file_buffer", &qwertycoin_wasm_bridge::get_keys_file_buffer);
  emscripten::function("get_cache_file_buffer", &qwertycoin_wasm_bridge::get_cache_file_buffer);
  emscripten::function("change_wallet_password", &qwertycoin_wasm_bridge::change_wallet_password);
  emscripten::function("close", &qwertycoin_wasm_bridge::close);
}
extern "C"
{
  // stub so libc's socket-dependent implementation stays out of the link
  unsigned int if_nametoindex(const char*) { return 0; }
}
