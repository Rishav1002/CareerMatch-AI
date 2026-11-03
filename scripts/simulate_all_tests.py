import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

import tests.test_basic as tb
import tests.test_routes as tr
import tests.test_api_endpoints as ta

class DummyMonkeyPatch:
    def __init__(self):
        self._undo = []
    def setattr(self, target, name, value):
        old_val = getattr(target, name)
        self._undo.append((target, name, old_val))
        setattr(target, name, value)
    def undo(self):
        for target, name, old_val in reversed(self._undo):
            setattr(target, name, old_val)

mp = DummyMonkeyPatch()

tests = [
    (tb, 'test_sample_resume_and_jd_mandatory_skills', []),
    (tb, 'test_junk_resume_scores_under_10', []),
    (tb, 'test_no_skill_in_two_statuses_at_once', []),
    (tb, 'test_jwt_auth_and_student_profile', []),
    (tb, 'test_guest_bootstrap_and_invalid_token_401', []),
    (tb, 'test_module_1_job_market_intelligence', []),
    (tb, 'test_module_2_mock_interview_simulator', []),
    (tb, 'test_module_3_ats_simulator', []),
    (tb, 'test_module_4_github_portfolio_analyzer', [mp]),
    (tb, 'test_module_5_adaptive_roadmap_and_remediation', []),
    (tb, 'test_module_6_skill_assessment_non_executing_verifier', []),
    (tb, 'test_module_7_and_8_career_compare_and_pri', []),
    (tr, 'test_route_registry_contains_all_routes', []),
    (tr, 'test_route_aliases_resolve_correctly', []),
    (tr, 'test_all_route_panel_ids_exist_in_index_html', []),
    (tr, 'test_route_panels_have_meaningful_content', []),
    (tr, 'test_dead_overview_stub_is_removed', []),
    (tr, 'test_view_404_exists_and_has_actionable_links', []),
    (tr, 'test_component_required_ids_exist', []),
    (tr, 'test_database_retry_loop_is_present', []),
    (ta, 'test_roles_catalog_has_over_40_roles', []),
    (ta, 'test_health_check_returns_database_connected', []),
    (ta, 'test_ai_rate_limiter_and_usage', []),
]

print(f"Simulating all {len(tests)} tests...")
failures = []
for mod, name, args in tests:
    try:
        func = getattr(mod, name)
        func(*args)
        print(f"  PASS: {name}")
    except Exception as e:
        print(f"  FAIL: {name} -> {e}")
        traceback.print_exc()
        failures.append((name, str(e)))

print(f"\nResult: {len(tests) - len(failures)} passed, {len(failures)} failed.")
