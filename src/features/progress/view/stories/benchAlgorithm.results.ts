import type { BenchCheckpoint } from "./benchAlgorithm.fixtures";
import { algorithmEstimateSources } from "./algorithmScenario.results";

export {
  describeAlgorithmCheckpoint as describeBenchCheckpoint,
  formatAlgorithmBenchmark as formatBenchBenchmark,
  formatAlgorithmMeasurement as formatBenchMeasurement,
  formatAlgorithmSource as formatBenchSource,
} from "./algorithmScenario.results";

export function benchEstimateSources(checkpoint: BenchCheckpoint) {
  return algorithmEstimateSources(checkpoint, "bench");
}
