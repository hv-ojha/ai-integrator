---
name: Performance Improvement
about: Improve performance
---

## ⚡ Performance Improvement

### Description

<!-- Describe the performance improvement -->

### Motivation

<!-- Why is this optimization needed? What problem does it solve? -->

---

## 📊 Performance Impact

### Benchmark Results

<!-- Provide before/after benchmarks -->

**Before:**
```
Operation: <!-- name -->
Time: <!-- e.g., 150ms -->
Memory: <!-- e.g., 50MB -->
```

**After:**
```
Operation: <!-- name -->
Time: <!-- e.g., 50ms -->
Memory: <!-- e.g., 30MB -->
```

**Improvement:**
- Time: <!-- e.g., 66.7% faster -->
- Memory: <!-- e.g., 40% less memory -->

### Benchmark Code

<!-- Provide the benchmark code used to measure performance -->

```typescript
// Benchmark code
```

---

## 🔍 Analysis

### Bottleneck Identified

<!-- What was causing the performance issue? -->

### Profiling Results

<!-- Share profiling data if available -->

<!--
- CPU profiling
- Memory profiling
- Flame graphs
-->

---

## 🔧 Solution

### Optimization Approach

<!-- Describe the optimization technique used -->

- [ ] Algorithm optimization
- [ ] Caching
- [ ] Lazy loading
- [ ] Reduced allocations
- [ ] Batch processing
- [ ] Parallel processing
- [ ] Other: <!-- specify -->

### Implementation Details

<!-- Explain how the optimization works -->

---

## 🧪 Testing

### Performance Tests

- [ ] Benchmark tests added
- [ ] Performance regression tests added
- [ ] Tested with realistic workloads
- [ ] Tested at scale

### Correctness Tests

- [ ] All existing tests pass
- [ ] Behavior remains unchanged
- [ ] Edge cases still handled correctly

---

## 📋 Checklist

### Performance

- [ ] Measurable performance improvement
- [ ] No performance regression in other areas
- [ ] Optimization is worth the added complexity
- [ ] Benchmark results documented

### Code Quality

- [ ] Code remains readable and maintainable
- [ ] No breaking changes
- [ ] Type safety maintained
- [ ] Error handling preserved

### Documentation

- [ ] Performance improvements documented
- [ ] Benchmark results included
- [ ] Code comments explain optimization

---

## ⚠️ Trade-offs

### What's Better?

<!-- What improved? -->

-
-

### What's Worse? (if any)

<!-- Any downsides? -->

-
-

### Justification

<!-- Why are the trade-offs acceptable? -->

---

## 💥 Breaking Changes

- [ ] No breaking changes
- [ ] Contains breaking changes (explain below)

<!-- If breaking, explain why necessary for performance -->

---

## 📊 Impact

### Bundle Size

<!-- Does this optimization affect bundle size? -->

- [ ] No impact
- [ ] Reduces size by: <!-- amount -->
- [ ] Increases size by: <!-- amount --> (justify below)

### Memory Usage

<!-- Impact on memory usage -->

- [ ] Reduces memory usage
- [ ] No impact
- [ ] Increases memory usage (justify below)

### CPU Usage

<!-- Impact on CPU usage -->

- [ ] Reduces CPU usage
- [ ] No impact
- [ ] Increases CPU usage (justify below)

---

## 🔬 Testing Environment

### Hardware

- CPU: <!-- e.g., Intel i7-9700K -->
- RAM: <!-- e.g., 16GB -->
- OS: <!-- e.g., Ubuntu 22.04 -->

### Software

- Node.js version: <!-- e.g., 20.x -->
- Other relevant info:

---

## 📈 Scenarios Tested

### Workload 1: <!-- name -->

<!-- Describe workload -->

- Before: <!-- measurement -->
- After: <!-- measurement -->
- Improvement: <!-- percentage -->

### Workload 2: <!-- name -->

<!-- Describe workload -->

- Before: <!-- measurement -->
- After: <!-- measurement -->
- Improvement: <!-- percentage -->

---

## 🔗 References

<!-- Link to related performance issues or discussions -->

- Related issue: #<!-- number -->
- Profiling data: <!-- link -->
- Benchmark comparisons: <!-- link -->

---

## 👀 Reviewer Focus Areas

- [ ] Benchmark accuracy
- [ ] Performance gains are real
- [ ] No correctness issues introduced
- [ ] Optimization is maintainable
- [ ] Trade-offs are acceptable
