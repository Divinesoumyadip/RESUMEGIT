'use server'

export async function checkBackendHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { 
      cache: 'no-store' 
    });
    const latency = Date.now() - startTime;

    if (response.ok) {
      return { status: 'ONLINE', latency: `${latency}ms` };
    }
    return { status: 'DEGRADED', latency: 'N/A' };
  } catch (error) {
    return { status: 'OFFLINE', latency: 'N/A' };
  }
}
