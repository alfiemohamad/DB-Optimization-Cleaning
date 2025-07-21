import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import {
  httpRequestsTotal,
  httpRequestDuration,
  databaseQueryDuration,
} from "@/lib/metrics";

export async function GET(request: Request) {
  console.time("Users API Execution");
  const start = Date.now();
  const method = request.method;
  const route = "/api/users";

  try {
    // Bad practice: extract query params manually without proper parsing
    const url = new URL(request.url);
    const divisionFilter = url.searchParams.get("division");

    // [Perbaikan Imam] - Query dioptimalkan, hapus subquery, operasi string, dan cross join. Tambahkan pagination dan filter dengan index
    let query = `
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.birth_date,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        u.created_at,
        u.updated_at,
        a.email,
        ur.role,
        ud.division_name
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
    `;

    // [Perbaikan Imam] - Gunakan parameterized query untuk filter dan pagination
    const params = [];
    let whereClause = '';
    if (divisionFilter && divisionFilter !== "all") {
      whereClause = ` WHERE ud.division_name = $1`;
      params.push(divisionFilter);
    }
    query += whereClause;
    query += ` ORDER BY u.created_at DESC LIMIT 50 OFFSET 0`;

    const dbStart = Date.now();
    const result = await executeQuery(query, params);
    const dbDuration = (Date.now() - dbStart) / 1000;
    databaseQueryDuration.observe({ query_type: "users_query" }, dbDuration);

    // Bad practice: processing all data in memory with complex transformations
    // [Perbaikan Imam] - Perbaiki tipe data agar tidak menggunakan any
    // [Perbaikan Imam] - Mapping hasil query hanya pada field yang tersedia, tanpa kalkulasi dan properti yang tidak ada
    const users = result.rows.map((user: {
      id: number;
      username: string;
      full_name: string;
      birth_date: string;
      bio: string;
      long_bio: string;
      profile_json: object | null;
      address: string;
      phone_number: string;
      created_at: string;
      updated_at: string;
      email: string;
      role: string;
      division_name: string;
    }) => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      birthDate: user.birth_date,
      bio: user.bio,
      longBio: user.long_bio,
      profileJson: user.profile_json,
      address: user.address,
      phoneNumber: user.phone_number,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      role: user.role,
      division: user.division_name,
    }));

    // [Perbaikan Imam] - Hapus summary dan kalkulasi yang tidak relevan dengan hasil query baru

    // [Perbaikan Imam] - Response hanya data users dan total
    console.timeEnd("Users API Execution");
    return NextResponse.json({
      users,
      total: users.length,
      filteredBy: divisionFilter || "all",
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Users API error:", error);
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe({ method, route }, duration);
    httpRequestsTotal.inc({ method, route, status: "500" });

    console.timeEnd("Users API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
