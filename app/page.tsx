import { supabase } from '@/lib/supabase'
export default async function Home() {
  const { data, error } = await supabase.from('_test').select()
  
  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Lovefy ✅</h1>
      {error?.message === 'relation "_test" does not exist' 
        ? <p style={{ color: 'green' }}>✅ Supabase conectado com sucesso!</p>
        : <p style={{ color: 'red' }}>❌ Erro: {error?.message}</p>
      }
    </main>
  )
}