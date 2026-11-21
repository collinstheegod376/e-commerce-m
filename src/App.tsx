import '@google/model-viewer'
import { FormEvent, useMemo, useState } from 'react'

const asset = (name: string) => `/assets/${name}`

const categories = ['Tank Tops', 'Hoodies', 'Jorts', 'T Shirts'] as const
type Category = (typeof categories)[number]
type Page = 'shop' | 'search' | 'stories' | 'cart' | 'profile' | 'auth'
type CartItem = { category: Category; quantity: number; size: string; color: string }

const products: Record<
  Category,
  {
    eyebrow: string
    title: string
    description: string
    price: number
    features: string[]
    image?: string
    imageAlt?: string
    model?: string
  }
> = {
  'Tank Tops': {
    eyebrow: 'Essential Streetwear / 01',
    title: 'Tank Top',
    description:
      'A clean-cut heavyweight tank built for warm days and layered nights. Relaxed through the body with a structured neckline that keeps its shape.',
    price: 48,
    features: ['Heavyweight Cotton', 'Relaxed Cut', 'Reinforced Neckline', 'Everyday Layer'],
    image: asset('tank-top-maison-kriss.jpg'),
    imageAlt: 'Maison Kriss white athletic tank top with blue tribal side panels',
    model: asset('maison-kriss-tank-top.glb'),
  },
  Hoodies: {
    eyebrow: 'Streetwear Clothing Cyberpunk / 02',
    title: 'Hoodie',
    description:
      'Introducing our innovative Double Layered Zipper Mask Hoodie – the epitome of functionality and style. Crafted from a robust blend of heavy-duty cotton, fleece, and polyester, this hoodie ensures durability and comfort.',
    price: 128,
    features: [
      'Innovative Double-Layered Design',
      'Secure Kangaroo Pockets',
      'Techwear-inspired Functionality',
      'Cyberpunk Elegance',
    ],
    image: asset('hoodie-urban-legacy.jpg'),
    imageAlt: 'Model wearing the black Maison Kriss Urban Legacy zip-up hoodie',
  },
  Jorts: {
    eyebrow: 'Denim Uniform / 03',
    title: 'Jorts',
    description:
      'Longline denim shorts with a generous fit and considered utility details. Washed for softness, cut below the knee, and made to wear hard.',
    price: 82,
    features: ['Rigid Washed Denim', 'Longline Silhouette', 'Utility Pockets', 'Built To Last'],
    image: asset('jorts-maison-kriss-product.jpg'),
    imageAlt: 'Black Maison Kriss washed denim jorts',
    model: asset('maison-kriss-jorts.glb'),
  },
  'T Shirts': {
    eyebrow: 'Graphic Streetwear / 04',
    title: 'T-Shirt',
    description:
      'An oversized heavyweight graphic tee featuring the signature Truth Seeker neon drip print. Drop-shoulder construction with a structured rib collar built for daily rotation.',
    price: 64,
    features: [
      'Heavyweight Jersey',
      'Truth Seeker Print',
      'Oversized Drop Shoulder',
      'Ribbed Crewneck',
    ],
    image: asset('t-shirt-truth-seeker-v2.jpg'),
    imageAlt: 'Model wearing the oversized grey Truth Seeker graphic ringer T-shirt',
  },
}

const stories: {
  id: string
  number: string
  tag: string
  date: string
  title: string
  excerpt: string
  body: string[]
  image: string
  imageAlt: string
  category: Category
  cta: string
}[] = [
  {
    id: 'urban-legacy',
    number: '01',
    tag: 'Drop 04 / Lookbook',
    date: 'Nov 2026',
    title: 'Urban Legacy: Built for Late Hours',
    excerpt:
      'Contrast piping, heavyweight brushed fleece, and oversized hardware—how the Maison Kriss zip-up became the anchor piece of the collection.',
    body: [
      'Designed around late-night transit and layered utility, the Urban Legacy hoodie pairs a structured heavyweight fleece shell with electric blue and crimson seam piping that catches light without overwhelming the silhouette.',
      'Every seam is reinforced for daily rotation—from the full-length metal zip to the deep kangaroo pockets and bold Maison Kriss sleeve lettering.',
    ],
    image: asset('hoodie-urban-legacy.jpg'),
    imageAlt: 'Model wearing the black Maison Kriss Urban Legacy zip-up hoodie',
    category: 'Hoodies',
    cta: 'Shop Hoodies',
  },
  {
    id: 'truth-seeker',
    number: '02',
    tag: 'Graphics / Print Lab',
    date: 'Nov 2026',
    title: 'Truth Seeker: Neon Drip on Heavyweight Jersey',
    excerpt:
      'High-density plastisol ink meets a boxy ringer cut. Inside the screen-printing process behind our loudest everyday tee.',
    body: [
      'Built on dense heather jersey with contrast black ribbed collar and cuffs, the Truth Seeker tee balances relaxed drop-shoulder proportions with sharp street typography.',
      'The dripping neon green graphic is layered over a matte black base so the lettering holds its edge wash after wash.',
    ],
    image: asset('t-shirt-truth-seeker-v2.jpg'),
    imageAlt: 'Model wearing the oversized grey Truth Seeker graphic ringer T-shirt',
    category: 'T Shirts',
    cta: 'Shop T Shirts',
  },
  {
    id: 'denim-in-3d',
    number: '03',
    tag: 'Denim / 3D Archive',
    date: 'Nov 2026',
    title: 'Maison Kriss Jorts: Cut Below the Knee',
    excerpt:
      'Rigid washed black denim with vertical brush-stroke branding—now inspectable from every angle in our interactive 3D viewer.',
    body: [
      'Cut wide through the leg and washed for a lived-in charcoal fade, our longline jorts bring heavyweight workwear durability to warm-weather proportions.',
      'We scanned the garment into an interactive 3D model so you can inspect the silhouette, stitching, and leg print from every angle before adding it to your rotation.',
    ],
    image: asset('jorts-maison-kriss-product.jpg'),
    imageAlt: 'Black Maison Kriss washed denim jorts',
    category: 'Jorts',
    cta: 'Inspect Jorts in 3D',
  },
]

function IconButton({
  src,
  label,
  onClick,
  badge,
}: {
  src: string
  label: string
  onClick: () => void
  badge?: number
}) {
  return (
    <button className="icon-button" aria-label={label} onClick={onClick}>
      <img src={src} alt="" />
      {badge ? <span className="cart-badge">{badge}</span> : null}
    </button>
  )
}

function ProductMark({ category }: { category: Category }) {
  const image = products[category].image
  return (
    <div
      className={`product-mark ${image ? 'hoodie-mark' : ''} ${category === 'Jorts' ? 'jorts-mark' : ''}`}
    >
      {image ? (
        <img src={image} alt="" />
      ) : (
        <span>{category === 'Tank Tops' ? 'TT' : 'JO'}</span>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('shop')
  const [category, setCategory] = useState<Category>('Hoodies')
  const [quantity, setQuantity] = useState('1')
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('Slate')
  const [cart, setCart] = useState<CartItem[]>([])
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'create'>('signin')
  const [signedIn, setSignedIn] = useState(false)
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null)
  const product = products[category]
  const activeStory = stories.find((story) => story.id === activeStoryId) ?? null
  const currentIndex = categories.indexOf(category)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce(
    (total, item) => total + products[item.category].price * item.quantity,
    0,
  )

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((item) => {
      const itemProduct = products[item]
      return `${item} ${itemProduct.description} ${itemProduct.features.join(' ')}`
        .toLowerCase()
        .includes(term)
    })
  }, [search])

  const goShop = (nextCategory?: Category) => {
    if (nextCategory) setCategory(nextCategory)
    setPage('shop')
    setNotice('')
  }

  const addToCart = () => {
    const amount = Number(quantity)
    setCart((items) => {
      const match = items.findIndex(
        (item) => item.category === category && item.size === size && item.color === color,
      )
      if (match < 0) return [...items, { category, quantity: amount, size, color }]
      return items.map((item, index) =>
        index === match ? { ...item, quantity: item.quantity + amount } : item,
      )
    })
    setNotice(`${amount} ${product.title} added — ${size}, ${color}`)
  }

  const updateCartQuantity = (index: number, next: number) => {
    setCart((items) =>
      next <= 0
        ? items.filter((_, itemIndex) => itemIndex !== index)
        : items.map((item, itemIndex) =>
            itemIndex === index ? { ...item, quantity: next } : item,
          ),
    )
  }

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSignedIn(true)
    setPage('profile')
  }

  return (
    <main className={`storefront ${page !== 'shop' ? 'inner-page' : ''}`}>
      <img className="guide-lines" src={asset('b6522.svg')} alt="" />

      <header className="site-header">
        <button className="wordmark" onClick={() => goShop('Hoodies')}>
          Hoodie
        </button>
        <nav className="top-nav" aria-label="Primary navigation">
          <button className={page === 'shop' ? 'active' : ''} onClick={() => goShop()}>
            products
          </button>
          <button className={page === 'search' ? 'active' : ''} onClick={() => setPage('search')}>
            discover
          </button>
          <button
            className={page === 'stories' ? 'active' : ''}
            onClick={() => {
              setActiveStoryId(null)
              setPage('stories')
            }}
          >
            stories
          </button>
          <button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')}>
            account
          </button>
        </nav>
        <div className="header-actions">
          <IconButton
            src={asset('331af.svg')}
            label="Search"
            onClick={() => setPage('search')}
          />
          <IconButton
            src={asset('ac74f.svg')}
            label={`Cart with ${cartCount} items`}
            badge={cartCount}
            onClick={() => setPage('cart')}
          />
          <IconButton
            src={asset('b44a0.svg')}
            label="Profile"
            onClick={() => setPage(signedIn ? 'profile' : 'auth')}
          />
        </div>
      </header>

      {page === 'shop' ? (
        <>
          <aside className="side-menu" aria-label="Shop categories">
            <h2>Shop</h2>
            <div className="category-list">
              {categories.map((item) => (
                <button
                  className={item === category ? 'selected' : ''}
                  key={item}
                  onClick={() => {
                    setCategory(item)
                    setNotice('')
                  }}
                >
                  {item}
                  {item === 'Tank Tops' || item === 'T Shirts' ? <span>New</span> : null}
                </button>
              ))}
            </div>
            <h2 className="info-label">Info</h2>
          </aside>

          <section className="product-content" id="products" aria-live="polite">
            <p className="eyebrow">{product.eyebrow}</p>
            <h1>{product.title}</h1>
            <p className="description">{product.description}</p>

            <div className="selectors">
              <label>
                <span>Qty</span>
                <select value={quantity} onChange={(event) => setQuantity(event.target.value)}>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                </select>
              </label>
              <label>
                <span>Size</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option>XS</option>
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                </select>
              </label>
              <label>
                <span>Color</span>
                <select value={color} onChange={(event) => setColor(event.target.value)}>
                  <option>Slate</option>
                  <option>Black</option>
                  <option>Bone</option>
                </select>
              </label>
            </div>

            <div className="product-actions">
              <button className="add-button" onClick={addToCart}>
                <img src={asset('167f0.svg')} alt="" />
                Add To Cart <strong>${product.price}</strong>
              </button>
              <button
                className="intro-button"
                onClick={() => setNotice('Lookbook preview coming soon.')}
              >
                <img src={asset('8203c.svg')} alt="" />
                Watch Intro
              </button>
            </div>
            <p className="notice" role="status">
              {notice}
            </p>

            <div className="feature-rail" id="info">
              {product.features.map((feature, index) => (
                <button key={feature} title={feature}>
                  {index === 0 ? <img src={asset('7ebb4.svg')} alt="" /> : null}
                  {index === product.features.length - 1 ? (
                    <img src={asset('5f9c0.svg')} alt="" />
                  ) : null}
                  <span>{feature}</span>
                </button>
              ))}
            </div>
          </section>

          {product.model ? (
            <div
              className="hero-image hero-3d"
              aria-label={`Interactive 3D view of ${product.imageAlt ?? product.title}`}
            >
              <model-viewer
                key={product.model}
                src={product.model}
                poster={product.image}
                alt={product.imageAlt ?? product.title}
                camera-controls
                auto-rotate
                auto-rotate-delay="1500"
                rotation-per-second="18deg"
                shadow-intensity="0.65"
                shadow-softness="0.85"
                exposure="1.05"
                environment-image="neutral"
                interaction-prompt="auto"
                touch-action="pan-y"
              />
              <div className="model-hint" aria-hidden="true">
                <span>3D Interactive</span>
                <span>Drag to rotate · Scroll to zoom</span>
              </div>
            </div>
          ) : (
            <div
              className={`hero-image ${product.image ? 'hero-image-contain' : ''} ${category === 'Jorts' ? 'hero-image-center' : ''}`}
              aria-label={product.imageAlt ?? 'Model wearing the featured dark technical hoodie'}
            >
              <img
                src={product.image ?? asset('57c8a.png')}
                alt={product.imageAlt ?? 'Model wearing a dark technical hoodie'}
              />
            </div>
          )}

          <aside className="pagination" aria-label="Product category pagination">
            {categories.map((item, index) => (
              <button
                key={item}
                className={item === category ? 'current' : ''}
                onClick={() => setCategory(item)}
                aria-label={`Show ${item}`}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </aside>

          <div className="carousel-controls">
            <img className="control-shape" src={asset('d1fbc.svg')} alt="" />
            <button
              aria-label="Previous category"
              onClick={() =>
                setCategory(categories[(currentIndex - 1 + categories.length) % categories.length])
              }
            >
              <img className="previous-arrow" src={asset('74217.svg')} alt="" />
            </button>
            <button
              aria-label="Next category"
              onClick={() => setCategory(categories[(currentIndex + 1) % categories.length])}
            >
              <img src={asset('13807.svg')} alt="" />
            </button>
          </div>

          <img className="selector-rule" src={asset('d4b73.svg')} alt="" />
          <img className="tiny-caret" src={asset('301c5.svg')} alt="" />
        </>
      ) : null}

      {page === 'search' ? (
        <section className="page-shell search-page">
          <p className="page-kicker">Find your uniform</p>
          <div className="page-title-row">
            <h1>Search</h1>
            <span>{String(searchResults.length).padStart(2, '0')} results</span>
          </div>
          <label className="large-search">
            <img src={asset('331af.svg')} alt="" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try “black hoodie”"
            />
            {search ? (
              <button onClick={() => setSearch('')} aria-label="Clear search">
                Clear
              </button>
            ) : null}
          </label>
          <div className="result-grid">
            {searchResults.map((item, index) => (
              <button className="result-card" key={item} onClick={() => goShop(item)}>
                <span className="result-number">0{index + 1}</span>
                <ProductMark category={item} />
                <span className="result-meta">New collection</span>
                <strong>{products[item].title}</strong>
                <span>${products[item].price}</span>
              </button>
            ))}
            {!searchResults.length ? (
              <div className="empty-state">
                <strong>Nothing found.</strong>
                <p>Try hoodie, t-shirt, denim, cotton, tank, or jorts.</p>
                <button onClick={() => setSearch('')}>View all products</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {page === 'stories' ? (
        <section className="page-shell stories-page">
          <p className="page-kicker">Editorial / Archive</p>
          <div className="page-title-row">
            <h1>Stories</h1>
            <span>{String(stories.length).padStart(2, '0')} dispatches</span>
          </div>

          {activeStory ? (
            <article className="story-reader">
              <button className="story-back" onClick={() => setActiveStoryId(null)}>
                ← All stories
              </button>
              <div className="story-reader-grid">
                <div className="story-visual story-reader-visual">
                  <img src={activeStory.image} alt={activeStory.imageAlt} />
                </div>
                <div className="story-reader-body">
                  <div className="story-meta">
                    <span>
                      {activeStory.number} / {activeStory.tag}
                    </span>
                    <span>{activeStory.date}</span>
                  </div>
                  <h2>{activeStory.title}</h2>
                  {activeStory.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <div className="story-actions">
                    <button
                      className="primary-action"
                      onClick={() => goShop(activeStory.category)}
                    >
                      {activeStory.cta}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <>
              <article className="story-lead">
                <button
                  className="story-visual story-lead-visual"
                  onClick={() => setActiveStoryId(stories[0].id)}
                  aria-label={`Read ${stories[0].title}`}
                >
                  <img src={stories[0].image} alt={stories[0].imageAlt} />
                </button>
                <div className="story-lead-copy">
                  <div className="story-meta">
                    <span>
                      {stories[0].number} / {stories[0].tag}
                    </span>
                    <span>{stories[0].date}</span>
                  </div>
                  <h2>{stories[0].title}</h2>
                  <p>{stories[0].excerpt}</p>
                  <div className="story-actions">
                    <button
                      className="primary-action"
                      onClick={() => setActiveStoryId(stories[0].id)}
                    >
                      Read dispatch
                    </button>
                    <button
                      className="story-link"
                      onClick={() => goShop(stories[0].category)}
                    >
                      {stories[0].cta}
                    </button>
                  </div>
                </div>
              </article>

              <div className="stories-grid">
                {stories.slice(1).map((story) => (
                  <article className="story-card" key={story.id}>
                    <div className="story-meta">
                      <span>
                        {story.number} / {story.tag}
                      </span>
                      <span>{story.date}</span>
                    </div>
                    <button
                      className="story-visual story-card-visual"
                      onClick={() => setActiveStoryId(story.id)}
                      aria-label={`Read ${story.title}`}
                    >
                      <img src={story.image} alt={story.imageAlt} />
                    </button>
                    <h3>{story.title}</h3>
                    <p>{story.excerpt}</p>
                    <div className="story-card-footer">
                      <button
                        className="story-link"
                        onClick={() => setActiveStoryId(story.id)}
                      >
                        Read dispatch
                      </button>
                      <button
                        className="story-link muted"
                        onClick={() => goShop(story.category)}
                      >
                        {story.cta}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {page === 'cart' ? (
        <section className="page-shell cart-page">
          <p className="page-kicker">Your selection</p>
          <div className="page-title-row">
            <h1>Cart</h1>
            <span>{String(cartCount).padStart(2, '0')} items</span>
          </div>
          {cart.length ? (
            <div className="cart-layout">
              <div className="cart-list">
                {cart.map((item, index) => (
                  <article className="cart-row" key={`${item.category}-${item.size}-${item.color}`}>
                    <ProductMark category={item.category} />
                    <div className="cart-info">
                      <p>0{index + 1} / New collection</p>
                      <h2>{products[item.category].title}</h2>
                      <span>
                        {item.color} · Size {item.size}
                      </span>
                    </div>
                    <div className="quantity-stepper">
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity - 1)}
                        aria-label={`Remove one ${item.category}`}
                      >
                        −
                      </button>
                      <span>{String(item.quantity).padStart(2, '0')}</span>
                      <button
                        onClick={() => updateCartQuantity(index, item.quantity + 1)}
                        aria-label={`Add one ${item.category}`}
                      >
                        +
                      </button>
                    </div>
                    <strong>${products[item.category].price * item.quantity}</strong>
                  </article>
                ))}
              </div>
              <aside className="order-summary">
                <p>Order summary</p>
                <div>
                  <span>Subtotal</span>
                  <strong>${subtotal}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>Complimentary</strong>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <strong>${subtotal}</strong>
                </div>
                <button onClick={() => setNotice('Checkout flow ready for payment connection.')}>
                  Continue to checkout
                </button>
                <small>{notice || 'Taxes calculated at checkout'}</small>
              </aside>
            </div>
          ) : (
            <div className="empty-state cart-empty">
              <strong>Your cart is empty.</strong>
              <p>Start with one of our four everyday forms.</p>
              <button onClick={() => goShop()}>Explore the collection</button>
            </div>
          )}
        </section>
      ) : null}

      {page === 'auth' ? (
        <section className="page-shell auth-page">
          <div className="auth-editorial">
            <span>Members / 001</span>
            <h1>Wear it your way.</h1>
            <p>Save your fit, track orders, and get first access to every limited release.</p>
            <div className="auth-figure">
              <img src={asset('57c8a.png')} alt="" />
            </div>
          </div>
          <form className="auth-form" onSubmit={submitAuth}>
            <p className="page-kicker">{authMode === 'signin' ? 'Welcome back' : 'Join the uniform'}</p>
            <h2>{authMode === 'signin' ? 'Sign in' : 'Create account'}</h2>
            {authMode === 'create' ? (
              <label>
                <span>Name</span>
                <input required placeholder="Your name" />
              </label>
            ) : null}
            <label>
              <span>Email</span>
              <input required type="email" placeholder="you@example.com" />
            </label>
            <label>
              <span>Password</span>
              <input required type="password" placeholder="At least 8 characters" minLength={8} />
            </label>
            <button className="primary-action" type="submit">
              {authMode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              className="text-action"
              type="button"
              onClick={() => setAuthMode(authMode === 'signin' ? 'create' : 'signin')}
            >
              {authMode === 'signin'
                ? 'New here? Create an account'
                : 'Already a member? Sign in'}
            </button>
          </form>
        </section>
      ) : null}

      {page === 'profile' ? (
        <section className="page-shell profile-page">
          <p className="page-kicker">Member space</p>
          <div className="page-title-row">
            <h1>Profile</h1>
            <button
              className="profile-status"
              onClick={() => {
                if (!signedIn) setPage('auth')
              }}
            >
              <span />
              {signedIn ? 'Active member' : 'Guest profile'}
            </button>
          </div>
          <div className="profile-grid">
            <aside className="profile-card">
              <div className="avatar">{signedIn ? 'AM' : 'G'}</div>
              <span>{signedIn ? 'Member / 000184' : 'Not signed in'}</span>
              <h2>{signedIn ? 'Alex Morgan' : 'Guest'}</h2>
              <p>{signedIn ? 'alex@uniform.example' : 'Sign in to sync orders and saved sizing.'}</p>
              <button onClick={() => setPage('auth')}>
                {signedIn ? 'Account settings' : 'Sign in or create account'}
              </button>
            </aside>
            <div className="profile-content">
              <section>
                <div className="section-heading">
                  <div>
                    <span>01</span>
                    <h2>Recent orders</h2>
                  </div>
                  <button onClick={() => setPage('cart')}>View cart</button>
                </div>
                <div className="order-placeholder">
                  <p>{signedIn ? 'Order #HD-0184' : 'No orders yet'}</p>
                  <strong>{signedIn ? 'Hoodie / Slate / M' : 'Your order history will appear here.'}</strong>
                  <span>{signedIn ? 'In transit' : '—'}</span>
                </div>
              </section>
              <section>
                <div className="section-heading">
                  <div>
                    <span>02</span>
                    <h2>Saved fit</h2>
                  </div>
                </div>
                <div className="fit-grid">
                  <div>
                    <span>Top</span>
                    <strong>M</strong>
                  </div>
                  <div>
                    <span>Bottom</span>
                    <strong>32</strong>
                  </div>
                  <div>
                    <span>Preference</span>
                    <strong>Relaxed</strong>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
