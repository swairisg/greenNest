// Minimal ridge regression with standardization.
function fitRidge(X, y, lambda = 1.0) {
  const N = X.length, D = X[0]?.length ?? 0;
  if (!N || !D) throw new Error("Empty dataset");

  const means = Array(D).fill(0), stds = Array(D).fill(0);
  for (let j = 0; j < D; j++) {
    let s = 0; for (let i = 0; i < N; i++) s += X[i][j];
    means[j] = s / N;
    let v = 0; for (let i = 0; i < N; i++) v += (X[i][j] - means[j]) ** 2;
    stds[j] = Math.sqrt(v / Math.max(1, N - 1)) || 1;
  }
  const Z = X.map(r => r.map((v, j) => (v - means[j]) / (stds[j] || 1)));

  const A = Array(D).fill(0).map(() => Array(D).fill(0));
  const b = Array(D).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < D; j++) {
      b[j] += Z[i][j] * y[i];
      for (let k = 0; k < D; k++) A[j][k] += Z[i][j] * Z[i][k];
    }
  }
  for (let j = 0; j < D; j++) A[j][j] += lambda;

  const w = solve(A, b);
  const meanY = y.reduce((a, c) => a + c, 0) / N;
  const theta = [meanY, ...w];

  const preds = Z.map(z => theta[0] + dot(w, z));
  const mse = preds.reduce((acc, p, i) => acc + (p - y[i]) ** 2, 0) / N;
  const varY = y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0) / Math.max(1, N - 1);
  const r2 = 1 - (mse / (varY || 1));
  return { theta, means, stds, r2, mse };
}

function predict(theta, means, stds, x) {
  const z = x.map((v, j) => (v - means[j]) / (stds[j] || 1));
  return theta[0] + dot(theta.slice(1), z);
}

function dot(a, b){ let s = 0; for (let i=0;i<a.length;i++) s += a[i]*b[i]; return s; }
function solve(A, b) {
  const n = A.length, M = A.map((r,i)=>[...r,b[i]]);
  for (let i=0;i<n;i++){
    let mr=i; for(let r=i+1;r<n;r++) if (Math.abs(M[r][i])>Math.abs(M[mr][i])) mr=r;
    [M[i],M[mr]]=[M[mr],M[i]];
    const p = M[i][i] || 1e-8;
    for (let c=i;c<=n;c++) M[i][c]/=p;
    for (let r=0;r<n;r++) if (r!==i){
      const f=M[r][i]; for (let c=i;c<=n;c++) M[r][c]-=f*M[i][c];
    }
  }
  return M.map(row => row[n]);
}
module.exports = { fitRidge, predict };
