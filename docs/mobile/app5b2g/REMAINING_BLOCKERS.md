# Remaining blockers

1. In API 35 CI, the native journey reaches the real Blueprint, opens the account form, and enters credentials, but the route returns to Blueprint before the `Create test account` action can be located.
2. Therefore native account creation/authentication, atomic claim, real member program load, and cold-restart session restoration are not end-to-end proven.
3. Physical-device runtime remains untested.

The next investigation should replace ADB text injection for the account form with an accessibility-native input/action mechanism or instrument route lifecycle diagnostics. Do not build native workout UI before this gate passes.
