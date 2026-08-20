"""
Parameterized version of main-code-kt-ss.py.
"""
import sys
import json
import time
import traceback
import numpy as np
import feloopy as flp


def build_and_solve(p: dict) -> dict:
    alpha = p["alpha"]
    beta = p["beta"]
    n_v = p["num_vehicles"]
    n_t = p["num_periods"]
    n_p = p["num_product_types"]
    n_m = p["num_modes"]

    dt = flp.data_toolkit(key=0)
    dt.store(name="alpha", value=alpha)
    dt.store(name="beta", value=beta)
    N = dt.set(name="N", bound=[0, alpha + beta])
    dt.store(name="D", value={0})
    C = dt.set(name="C", bound=[1, alpha + beta])
    M = dt.set(name="M", bound=[0, n_m - 1])
    P = dt.set(name="P", bound=[0, n_p - 1])
    A = dt.set(name="A", bound=[1, alpha])
    B = dt.set(name="B", bound=[alpha + 1, alpha + beta])
    T = dt.set(name="T", bound=[0, n_t - 1])
    V = dt.set(name="V", bound=[0, n_v - 1])

    vc_lo, vc_hi = p["variable_cost_range"]
    fc_lo, fc_hi = p["fixed_cost_range"]
    tc_lo, tc_hi = p["travel_cost_range"]
    r_lo, r_hi = p["risk_range"]
    mc_lo, mc_hi = p["maintenance_cost_range"]
    ac_lo, ac_hi = p["access_cost_range"]
    vcap_lo, vcap_hi = p["vehicle_capacity_range"]
    ccap_lo, ccap_hi = p["customer_capacity_range"]
    w_lo, w_hi = p["product_weight_range"]

    varphi = dt.uniformint(name="varphi", dim=[V, T], bound=[vc_lo, vc_hi])
    varphi_hat = dt.uniformint(name="varphi_hat", dim=[T, V], bound=[fc_lo, fc_hi])
    delta = dt.uniformint(name="delta", dim=[N, N, M, V, T], bound=[tc_lo, tc_hi])
    rho = dt.uniform(name="rho", dim=[N, N, M, T], bound=[r_lo, r_hi])
    gamma = dt.uniformint(name="gamma", dim=[C, P], bound=[mc_lo, mc_hi])
    omega = dt.uniformint(name="omega", dim=[N, N, M], bound=[ac_lo, ac_hi])

    alpha_hat = dt.uniformint(name="alpha_hat", dim=[A, T, P], bound=[1, 10])
    alpha_bar = dt.uniformint(name="alpha_bar", dim=[B, T, P], bound=[1, 10])
    kappa_v = dt.uniformint(name="kappa_v", dim=[V], bound=[vcap_lo, vcap_hi])
    mu = dt.uniformint(name="mu", dim=[P], bound=[w_lo, w_hi])
    theta = dt.uniformint(name="theta", dim=[C], bound=[ccap_lo, ccap_hi])
    dt.uniform(name="ph", dim=[N, N, M], bound=[0.13, 1.45])
    dt.uniformint(name="Lambda", dim=[N], bound=[2, 5])
    big_U = dt.store(name="U", value=1000000)

    def your_model(mdl):
        u = mdl.pvar(name="u", dim={(i, v, t) for i in mdl.sets(N) for v in mdl.sets(V) for t in mdl.sets(T)})
        y = mdl.bvar(name="y", dim=[N, N, M])
        x = mdl.bvar(name="x", dim=[N, N, M, V, T])
        d = mdl.pvar(name="d", dim={(i, v, t, p) for i, v, t, p in mdl.sets(A, V, T, P)})
        r = mdl.pvar(name="r", dim={(i, v, t, p) for i, v, t, p in mdl.sets(B, V, T, P)})
        q = mdl.pvar(name="q", dim={(i, p, t) for i, p, t in mdl.sets(C, P, T)})
        q_hat = mdl.pvar(name="q_hat", dim={(i, j, v, p, t) for i, j, v, p, t in mdl.sets(C, C, V, P, T)})
        mdl.pvar(name="w", dim=[N, V])

        term1 = mdl.sum(varphi_hat[t, v] * x[0, j, m, v, t] for j, m, v, t in mdl.sets(C, M, V, T))
        term2 = mdl.sum(varphi[v, t] * x[i, j, m, v, t] for i, j, m, v, t in mdl.sets(N, N, M, V, T))
        term3 = mdl.sum(gamma[i - 1, p] * q[i, p, t] for i, p, t in mdl.sets(C, P, T))
        term4 = mdl.sum(y[i, j, m] * omega[i, j, m] for i, j, m in mdl.sets(N, N, M))
        term5 = mdl.sum(rho[i, j, m, t] * x[i, j, m, v, t] for i, j, m, v, t in mdl.sets(N, N, M, V, T) if i != j)

        mdl.obj(term1 + term2 + term3 + term4)
        mdl.obj(term5)

        mdl.con([mdl.sum(x[i, j, m, v, t] for i, m in mdl.sets(N, M) if i != j) == mdl.sum(x[j, i, m, v, t] for i, m in mdl.sets(N, M) if i != j) for j, v, t in mdl.sets(N, V, T)])
        mdl.con([mdl.sum(x[i, j, m, v, t] for i, v, m in mdl.sets(N, V, M) if i != j) == 1 for j, t in mdl.sets(C, T)])
        mdl.con([u[i, v, t] + 1 + (len(mdl.sets(C))) * x[i, j, m, v, t] <= u[j, v, t] + len(mdl.sets(C)) for i in mdl.sets(C) for j in mdl.sets(C) for m in mdl.sets(M) for v in mdl.sets(V) for t in mdl.sets(T) if i != j])
        mdl.con([mdl.sum(x[0, j, m, v, t] for j, m in mdl.sets(C, M)) <= 1 for v, t in mdl.sets(V, T)])
        mdl.con([mdl.sum(x[i, j, m, v, t] for i, j, m, v in mdl.sets(B, A, M, V)) == 0 for t in mdl.sets(T)])
        mdl.con([y[i, j, m] >= mdl.sum(x[i, j, m, v, t] for v, t in mdl.sets(V, T)) for i, j, m in mdl.sets(N, N, M) if i != j])

        mdl.con([q[i, p, 0] == 0 for i, p in mdl.sets(A, P)])
        mdl.con([q[i, p, 0] == 0 for i, p in mdl.sets(B, P)])
        mdl.con([q[i, p, t] == q[i, p, t - 1] - mdl.sum(d[i, v, t, p] for v in V) + alpha_hat[i - 1, t, p] for i, p, t in mdl.sets(A, P, T) if t >= 1])
        mdl.con([q[i, p, t] == q[i, p, t - 1] + mdl.sum(r[i, v, t, p] for v in V) - alpha_bar[i - (alpha + 1), t, p] for i, p, t in mdl.sets(B, P, T) if t >= 1])
        mdl.con([mdl.sum(q[i, p, t] for p in P) <= theta[i - 1] for i, t in mdl.sets(A, T)])
        mdl.con([mdl.sum(q[i, p, t] for p in P) <= theta[i - (alpha + 1)] for i, t in mdl.sets(B, T)])

        mdl.con([mdl.sum(q_hat[i, j, v, p, t] for i, v in mdl.sets(C, V) if i != j) - mdl.sum(q_hat[j, i, v, p, t] for i, v in mdl.sets(C, V) if i != j) == mdl.sum(d[j, v, t, p] for v in V) for j, p, t in mdl.sets(A, P, T)])
        mdl.con([mdl.sum(mu[p] * d[j, v, t, p] for p in P) <= kappa_v[v] + big_U * (1 - x[i, j, m, v, t]) for i, j, m, v, t in mdl.sets(C, A, M, V, T) if i != j])
        mdl.con([mdl.sum(d[i, v, t, p] for v in V) >= alpha_hat[i - 1, t, p] for i, p, t in mdl.sets(A, P, T)])

        mdl.con([mdl.sum(q_hat[i, j, v, p, t] for i, v in mdl.sets(C, V) if i != j) - mdl.sum(q_hat[j, i, v, p, t] for i, v in mdl.sets(B, V) if i != j) == mdl.sum(r[j, v, t, p] for v in V) for j, p, t in mdl.sets(B, P, T)])
        mdl.con([mdl.sum(mu[p] * r[j, v, t, p] for p in P) <= kappa_v[v] + big_U * (1 - x[i, j, m, v, t]) for i, j, m, v, t in mdl.sets(C, B, M, V, T) if i != j])
        mdl.con([mdl.sum(r[i, v, t, p] for v in V) >= alpha_bar[i - (alpha + 1), t, p] for i, p, t in mdl.sets(B, P, T)])

        return mdl

    mdl = flp.search(
        environment=your_model,
        method="exact",
        approach="nwsm",
        interface="ortools",
        solver=p.get("solver", "cbc"),
        directions=["min", "min"],
        verbose=False,
        options={"intervals": 3, "method": "separated"},
    )
    return extract_results(mdl)


def extract_results(mdl) -> dict:
    result = {"objectives": {}, "routes": [], "inventory_levels": [], "debug": {}}

    try:
        raw_obj = np.asarray(mdl.objective_values, dtype=float)
        result["debug"]["objective_values_shape"] = list(raw_obj.shape)
        flat = raw_obj.flatten()
        if flat.size >= 2:
            result["objectives"]["cost"] = float(flat[0])
            result["objectives"]["risk"] = float(flat[1])
        elif flat.size == 1:
            result["objectives"]["cost"] = float(flat[0])
    except Exception as e:
        result["debug"]["objective_values_error"] = str(e)

    try:
        x_val = mdl.get("x")
        x_arr = np.asarray(x_val[0] if isinstance(x_val, list) else x_val)
        result["debug"]["x_shape"] = list(x_arr.shape)
        for idx in np.argwhere(x_arr > 0.5):
            i, j, m, v, t = [int(k) for k in idx]
            result["routes"].append({"from": i, "to": j, "mode": m, "vehicle": v, "period": t})
    except Exception as e:
        result["debug"]["x_error"] = str(e)

    try:
        q_val = mdl.get("q")
        if isinstance(q_val, list) and len(q_val) > 0 and isinstance(q_val[0], dict):
            q_val = q_val[0]
        if isinstance(q_val, dict):
            for key, val in q_val.items():
                if val and float(val) != 0:
                    i, p, t = key
                    result["inventory_levels"].append({"node": int(i), "product": int(p), "period": int(t), "level": float(val)})
        else:
            q_arr = np.asarray(q_val[0] if isinstance(q_val, list) else q_val)
            result["debug"]["q_shape"] = list(q_arr.shape)
            for idx in np.argwhere(q_arr > 0):
                i, p, t = [int(k) for k in idx]
                result["inventory_levels"].append({"node": i, "product": p, "period": t, "level": float(q_arr[tuple(idx)])})
    except Exception as e:
        result["debug"]["q_error"] = str(e)

    return result


if __name__ == "__main__":
    params_path, results_path = sys.argv[1], sys.argv[2]
    with open(params_path) as f:
        params = json.load(f)

    start = time.time()
    output = {"status": "completed"}
    try:
        output.update(build_and_solve(params))
    except Exception as e:
        output["status"] = "failed"
        output["error_message"] = f"{e}\n{traceback.format_exc()}"
    output["solve_time_seconds"] = time.time() - start

    with open(results_path, "w") as f:
        json.dump(output, f)