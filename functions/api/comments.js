// functions/api/comments.js
// Pages Function：处理 /api/comments 的 GET（获取留言）和 POST（提交留言）

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, nickname, content, created_at
       FROM comments
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 100`
    ).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    let nickname = (body.nickname || '').trim() || '匿名';
    const content = (body.content || '').trim();

    if (!content) {
      return new Response(JSON.stringify({ success: false, error: '留言内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (content.length > 500) {
      return new Response(JSON.stringify({ success: false, error: '留言不能超过 500 字' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (nickname.length > 20) {
      nickname = nickname.slice(0, 20);
    }

    const forbidden = /<[^>]*>|https?:\/\/|www\./i;
    if (forbidden.test(content) || forbidden.test(nickname)) {
      return new Response(JSON.stringify({ success: false, error: '内容包含不允许的字符或链接' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await env.DB.prepare(
      `INSERT INTO comments (nickname, content) VALUES (?, ?)`
    ).bind(nickname, content).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}