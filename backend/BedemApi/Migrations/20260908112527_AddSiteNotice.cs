using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddSiteNotice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteNotices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Text = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteNotices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteNotices_Users_UpdatedByUserId",
                        column: x => x.UpdatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "SiteNotices",
                columns: new[] { "Id", "Text", "UpdatedAt", "UpdatedByUserId" },
                values: new object[] { 1, "Sledeća javna akcija: Protest ispred Skupštine Beograda — subota, 2. avgusta u 11h", null, null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$MXSbbcrCZaDrgVX1fKtA2OEYh6ttWm5Z0ZhNJgWdYKjEfQZMOkdcu");

            migrationBuilder.CreateIndex(
                name: "IX_SiteNotices_UpdatedByUserId",
                table: "SiteNotices",
                column: "UpdatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteNotices");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$hjI6ySSnIZ1acEnt/bPAB.v7MKJ/zS0WwKEEUIP6dd.84XGg5Q3pi");
        }
    }
}
