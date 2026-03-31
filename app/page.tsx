import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['500', '700'],
})

export const metadata: Metadata = {
  title: 'Scribble - Veilige chat voor kinderen',
  description: 'Veilig chatten voor kinderen zonder zorgen',
}

export default function Home() {
  const features = [
    {
      title: 'Vrij communiceren',
      description:
        'Kinderen praten ongedwongen met vrienden en zetten hun eerste stappen in digitale communicatie.',
    },
    {
      title: 'Veilig by design',
      description:
        'Ouders zien of er netjes met elkaar wordt omgegaan, zonder mee te lezen. Privacy met een vangnet.',
    },
    {
      title: 'Bekende contacten',
      description:
        'Alleen chatten met kinderen die je kent van school, sport of hobby. Ouders beheren de toegang.',
    },
    {
      title: 'Toezicht zonder inkijk',
      description:
        'Ouders kunnen niet meelezen, maar krijgen wel een signaal als het niet goed gaat.',
    },
    {
      title: 'Geen e-mail of telefoonnummer',
      description:
        'Kinderen hebben geen e-mailadres of telefoonnummer nodig om te beginnen.',
    },
    {
      title: 'Tablet, iPad en telefoon',
      description:
        'Werk op elk apparaat. Kinderen starten op een tablet en kunnen later verder op telefoon.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Ouder downloadt Scribble',
      description: 'Download de app en maak een account aan.',
    },
    {
      number: '02',
      title: 'Voeg je kind toe',
      description: 'Maak een profiel aan voor je kind met een eigen inlog.',
    },
    {
      number: '03',
      title: 'Kind nodigt vrienden uit',
      description: 'Vanuit school, sport of hobby - alleen bekende contacten.',
    },
    {
      number: '04',
      title: 'Veilig chatten begint',
      description: 'Kinderen chatten vrij, ouders houden overzicht zonder mee te lezen.',
    },
  ]

  return (
    <main className="min-h-screen bg-[#11132c] text-[#f5f6ff]">
      <section className="relative overflow-hidden px-6 pb-28 pt-8 sm:px-10 sm:pb-36 lg:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[18%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#d837b8]/20 blur-[120px]" />
          <div className="absolute left-[18%] top-[32%] h-[280px] w-[280px] rounded-full bg-[#3f4cff]/15 blur-[120px]" />
          <div className="absolute right-[18%] top-[36%] h-[260px] w-[260px] rounded-full bg-[#7be55b]/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-24 flex justify-end">
            <Link
              href="/login"
              className="rounded-full border border-[#4f5385] px-6 py-2.5 text-sm font-medium text-white transition-all hover:border-[#d837b8] hover:shadow-[0_0_16px_rgba(216,55,184,0.45)]"
            >
              Inloggen
            </Link>
          </div>

          <div className="mx-auto max-w-2xl text-center">
            <Image src="/scribble_logo.png" alt="Scribble logo" width={78} height={78} className="mx-auto mb-4" />
            <h1 className="text-5xl font-bold tracking-tight text-[#e93bc3] sm:text-6xl">Scribble</h1>
            <p className="mt-4 text-2xl text-white/90">Veilig chatten voor kinderen. Vrij communiceren, zonder zorgen.</p>
            <p className="mx-auto mt-5 max-w-xl text-sm text-[#b8bcdd]">
              Een plek waar kinderen vanaf 8 jaar leren communiceren met vrienden van school, sport en hobby&apos;s.
              Ouders houden overzicht zonder gesprekken mee te lezen.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-[#d837b8] to-[#ff57cc] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(216,55,184,0.55)] transition-transform hover:scale-[1.02]"
              >
                Registreren
              </Link>
              <a
                href="#waarom"
                className="rounded-full border border-[#53588c] px-7 py-3 text-sm font-semibold text-white transition-all hover:border-[#d837b8] hover:shadow-[0_0_16px_rgba(216,55,184,0.35)]"
              >
                Meer informatie
              </a>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#30345e] bg-[#171936] px-4 py-1.5 text-xs text-[#ccd0ec]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7be55b]" />
              Nu in testfase - gratis meedoen
            </div>
          </div>
        </div>
      </section>

      <section id="waarom" className="px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              Waarom <span className="text-[#e93bc3]">Scribble</span>?
            </h2>
            <p className="mt-3 text-[#b8bcdd]">
              Gebouwd vanuit een overtuiging: kinderen verdienen een eigen, veilige plek om te leren communiceren.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-[#2d3055] bg-[#151734]/70 p-6 transition-all hover:border-[#d837b8] hover:shadow-[0_0_20px_rgba(216,55,184,0.35)]"
              >
                <h3 className={`${roboto.className} text-xl font-semibold text-white`}>{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#b8bcdd]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold text-white">Zo werkt het</h2>
          <p className="mt-3 text-[#b8bcdd]">In vier simpele stappen.</p>

          <div className="mt-10 space-y-4 text-left">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-5 rounded-2xl border border-[#2d3055] bg-[#151734]/70 px-6 py-5 transition-all hover:border-[#d837b8] hover:shadow-[0_0_20px_rgba(216,55,184,0.35)]"
              >
                <span className="text-3xl font-bold text-[#e93bc3]">{step.number}</span>
                <div>
                  <h3 className={`${roboto.className} text-lg font-semibold text-white`}>{step.title}</h3>
                  <p className="mt-1 text-sm text-[#b8bcdd]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Image src="/scribble_logo.png" alt="Scribble logo" width={52} height={52} className="mx-auto mt-10" />
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#9ce36e]">Voor ouders</p>
            <h2 className="text-4xl font-bold leading-tight text-white">Vertrouwen geven, controle houden</h2>
            <p className="text-[#b8bcdd]">
              We begrijpen het: je wilt je kind vrijheid geven, maar ook beschermen. Scribble is ontworpen vanuit
              precies die balans.
            </p>
            <p className="text-[#b8bcdd]">
              Ouders kunnen niet meelezen in gesprekken. Je krijgt alleen een signaal wanneer dat echt nodig is.
              Kinderen houden hun privacy, ouders houden overzicht.
            </p>
            <Link
              href="/register"
              className="inline-flex rounded-full bg-gradient-to-r from-[#d837b8] to-[#ff57cc] px-7 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(216,55,184,0.55)] transition-transform hover:scale-[1.02]"
            >
              Doe mee aan de test
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[320px] rounded-[2rem] border border-[#4d5182] bg-[#1a1d3d] p-4 shadow-[0_12px_50px_rgba(5,8,30,0.75)]">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#2d3055] bg-[#141735] px-3 py-2">
              <div className="flex items-center gap-2">
                <Image src="/scribble_logo.png" alt="Scribble logo" width={22} height={22} />
                <span className="text-xs text-white/90">Scribble</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#7be55b]" />
            </div>

            <div className="space-y-2">
              {['Emma', 'Liam', 'Sophie', 'Daan'].map((name, index) => (
                <div key={name} className="flex items-center gap-3 rounded-xl border border-[#2d3055] bg-[#141735] p-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{
                      backgroundColor: ['#ff4abf', '#89e450', '#8d6bff', '#3e99ff'][index],
                    }}
                  >
                    {name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-[#9ea4ce]">Hey! Ga je mee voetballen?</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-around rounded-2xl border border-[#2d3055] bg-[#141735] py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d837b8]" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#24274b] px-6 pb-12 pt-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white">Klaar om mee te doen?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#b8bcdd]">
            We zijn op zoek naar gezinnen die Scribble willen testen. Gratis, veilig en jouw feedback telt.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#d837b8] to-[#ff57cc] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(216,55,184,0.55)] transition-transform hover:scale-[1.02]"
          >
            Start met Scribble
          </Link>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[#24274b] pt-5 text-xs text-[#9ea4ce]">
          <div className="flex items-center gap-2">
            <Image src="/scribble_logo.png" alt="Scribble logo" width={22} height={22} />
            <span>Scribble</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <span>Privacy eerst</span>
            <span>Testfase</span>
          </div>
          <span>(c) 2026 Scribble. Een project met hart.</span>
        </div>
      </section>
    </main>
  )
}

