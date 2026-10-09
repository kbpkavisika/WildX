interface SimulationResultProps {
  result: string | null;
  error: string | null;
  children: React.ReactNode;
}

export function SimulationResult({ result, error, children }: SimulationResultProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {error && <p role="alert" className="m-0 mr-auto text-body text-negative">{error}</p>}
      {!error && result && <p role="status" className="m-0 mr-auto text-body text-positive">{result}</p>}
      {children}
    </div>
  );
}
